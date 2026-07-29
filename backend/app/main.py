"""ServerDock API: SSH-backed management endpoints for authorized Linux servers."""
import asyncio, os, time
from pathlib import Path
from typing import Optional
import jwt, psutil
from fastapi import FastAPI, HTTPException, UploadFile, File, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from pydantic import BaseModel

ROOT = Path(os.getenv('MANAGED_ROOT', '/srv/serverdock')).resolve()
SECRET = os.getenv('JWT_SECRET', 'change-this-before-production')
pwd = CryptContext(schemes=['bcrypt'], deprecated='auto'); auth = HTTPBearer()
app = FastAPI(title='ServerDock API', version='0.1.0')
app.add_middleware(CORSMiddleware, allow_origins=os.getenv('CORS_ORIGINS','http://localhost:5173').split(','), allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

class Login(BaseModel): username:str; password:str
class ServiceAction(BaseModel): action:str
def user(c: HTTPAuthorizationCredentials = Depends(auth)):
    try: return jwt.decode(c.credentials, SECRET, algorithms=['HS256'])
    except jwt.PyJWTError: raise HTTPException(401,'Sesión no válida')
def safe_path(path:str) -> Path:
    target=(ROOT/path.lstrip('/')).resolve()
    if ROOT not in target.parents and target != ROOT: raise HTTPException(400,'Ruta no permitida')
    return target

@app.get('/health')
def health(): return {'status':'ok'}
@app.post('/auth/login')
def login(data:Login):
    if data.username != os.getenv('ADMIN_USER','admin') or not pwd.verify(data.password, os.getenv('ADMIN_PASSWORD_HASH', pwd.hash('change-me'))): raise HTTPException(401,'Credenciales inválidas')
    return {'access_token':jwt.encode({'sub':data.username,'exp':time.time()+3600*8},SECRET,algorithm='HS256'),'token_type':'bearer'}
@app.get('/metrics')
def metrics(_:dict=Depends(user)):
    disk=psutil.disk_usage('/')
    return {'cpu':psutil.cpu_percent(), 'memory':psutil.virtual_memory()._asdict(), 'disk':{'total':disk.total,'used':disk.used,'percent':disk.percent}, 'network':psutil.net_io_counters()._asdict(), 'uptime':time.time()-psutil.boot_time()}
@app.get('/files')
def list_files(path:str='/', _:dict=Depends(user)):
    p=safe_path(path)
    if not p.exists() or not p.is_dir(): raise HTTPException(404,'Carpeta no encontrada')
    return [{'name':x.name,'directory':x.is_dir(),'size':x.stat().st_size,'modified':x.stat().st_mtime} for x in p.iterdir()]
@app.post('/files/upload')
async def upload(path:str='/', file:UploadFile=File(...), _:dict=Depends(user)):
    destination=safe_path(path)/Path(file.filename or 'upload').name; destination.parent.mkdir(parents=True,exist_ok=True)
    destination.write_bytes(await file.read()); return {'path':str(destination.relative_to(ROOT))}
@app.post('/services/{name}/action')
async def service_action(name:str,data:ServiceAction,_:dict=Depends(user)):
    if data.action not in {'start','stop','restart','status'}: raise HTTPException(400,'Acción inválida')
    proc=await asyncio.create_subprocess_exec('systemctl',data.action,f'{name}.service',stdout=asyncio.subprocess.PIPE,stderr=asyncio.subprocess.PIPE)
    out,err=await proc.communicate(); return {'ok':proc.returncode==0,'output':(out+err).decode()}
@app.websocket('/ws/logs')
async def logs(socket:WebSocket):
    await socket.accept()
    while True:
        await socket.send_json({'level':'INFO','message':'Conexión de registros activa','timestamp':time.time()}); await asyncio.sleep(3)
