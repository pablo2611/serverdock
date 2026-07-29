"""ServerDock API. Account and encrypted connection metadata are persistent; VPS files are not copied here."""
import asyncio, os, sqlite3, time
from pathlib import Path
from typing import Optional
import jwt, psutil
from cryptography.fernet import Fernet
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from pydantic import BaseModel

ROOT = Path(os.getenv('MANAGED_ROOT', '/srv/serverdock')).resolve()
DB_PATH = Path(os.getenv('DATABASE_PATH', '/var/lib/serverdock/serverdock.db'))
SECRET = os.environ['JWT_SECRET']
crypt = Fernet(os.environ['CONNECTION_ENCRYPTION_KEY'].encode())
pwd, auth = CryptContext(schemes=['bcrypt'], deprecated='auto'), HTTPBearer()
app = FastAPI(title='ServerDock API')
app.add_middleware(CORSMiddleware, allow_origins=os.getenv('CORS_ORIGINS','http://localhost:5173').split(','), allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

class Login(BaseModel): email:str; password:str
class Register(Login): pass
class ServerConnection(BaseModel):
    name:str; host:str; port:int=22; username:str; auth_type:str='key'; private_key:Optional[str]=None; password:Optional[str]=None
class ServiceAction(BaseModel): action:str
def db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True); con=sqlite3.connect(DB_PATH); con.row_factory=sqlite3.Row
    con.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at REAL NOT NULL)')
    con.execute('CREATE TABLE IF NOT EXISTS servers (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, name TEXT NOT NULL, host TEXT NOT NULL, port INTEGER NOT NULL, username TEXT NOT NULL, auth_type TEXT NOT NULL, credential BLOB NOT NULL, created_at REAL NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id))')
    return con
def user(c:HTTPAuthorizationCredentials=Depends(auth)):
    try: return jwt.decode(c.credentials, SECRET, algorithms=['HS256'])
    except jwt.PyJWTError: raise HTTPException(401, 'Invalid session')
def uid(payload:dict): return int(payload['sub'])
def safe_path(path:str):
    target=(ROOT/path.lstrip('/')).resolve()
    if ROOT not in target.parents and target!=ROOT: raise HTTPException(400, 'Forbidden path')
    return target
def token(id:int): return {'access_token':jwt.encode({'sub':str(id),'exp':time.time()+28800},SECRET,algorithm='HS256'),'token_type':'bearer'}

@app.get('/health')
def health(): return {'status':'ok'}
@app.post('/auth/register')
def register(data:Register):
    con=db()
    try:
        result=con.execute('INSERT INTO users(email,password_hash,created_at) VALUES(?,?,?)',(data.email.lower().strip(),pwd.hash(data.password),time.time())); con.commit()
    except sqlite3.IntegrityError: raise HTTPException(409, 'Email already registered')
    return token(result.lastrowid)
@app.post('/auth/login')
def login(data:Login):
    row=db().execute('SELECT * FROM users WHERE email=?',(data.email.lower().strip(),)).fetchone()
    if not row or not pwd.verify(data.password,row['password_hash']): raise HTTPException(401, 'Invalid credentials')
    return token(row['id'])
@app.get('/servers')
def servers(payload:dict=Depends(user)):
    return [dict(x) for x in db().execute('SELECT id,name,host,port,username,auth_type,created_at FROM servers WHERE user_id=?',(uid(payload),)).fetchall()]
@app.post('/servers')
def add_server(data:ServerConnection,payload:dict=Depends(user)):
    secret=data.private_key if data.auth_type=='key' else data.password
    if data.auth_type not in {'key','password'} or not secret: raise HTTPException(400, 'SSH credential required')
    con=db(); result=con.execute('INSERT INTO servers(user_id,name,host,port,username,auth_type,credential,created_at) VALUES(?,?,?,?,?,?,?,?)',(uid(payload),data.name,data.host,data.port,data.username,data.auth_type,crypt.encrypt(secret.encode()),time.time())); con.commit()
    return {'id':result.lastrowid,'name':data.name,'host':data.host,'port':data.port,'username':data.username,'auth_type':data.auth_type}
@app.get('/metrics')
def metrics(_:dict=Depends(user)):
    disk=psutil.disk_usage('/'); return {'cpu':psutil.cpu_percent(),'memory':psutil.virtual_memory()._asdict(),'disk':{'total':disk.total,'used':disk.used,'percent':disk.percent},'network':psutil.net_io_counters()._asdict(),'uptime':time.time()-psutil.boot_time()}
@app.get('/files')
def files(path:str='/',_:dict=Depends(user)):
    p=safe_path(path)
    return [{'name':x.name,'directory':x.is_dir(),'size':x.stat().st_size,'modified':x.stat().st_mtime} for x in p.iterdir()]
@app.post('/files/upload')
async def upload(path:str='/',file:UploadFile=File(...),_:dict=Depends(user)):
    dest=safe_path(path)/Path(file.filename or 'upload').name; dest.parent.mkdir(parents=True,exist_ok=True); dest.write_bytes(await file.read()); return {'path':str(dest.relative_to(ROOT))}
@app.post('/services/{name}/action')
async def service_action(name:str,data:ServiceAction,_:dict=Depends(user)):
    if data.action not in {'start','stop','restart','status'}: raise HTTPException(400,'Invalid action')
    p=await asyncio.create_subprocess_exec('systemctl',data.action,f'{name}.service',stdout=asyncio.subprocess.PIPE,stderr=asyncio.subprocess.PIPE); out,err=await p.communicate(); return {'ok':p.returncode==0,'output':(out+err).decode()}
@app.websocket('/ws/logs')
async def logs(socket:WebSocket):
    await socket.accept()
    while True: await socket.send_json({'level':'INFO','message':'Log connection active','timestamp':time.time()}); await asyncio.sleep(3)
