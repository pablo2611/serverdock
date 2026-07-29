import './style.css'

type View = 'Overview' | 'Console' | 'Files' | 'Logs' | 'Services' | 'Guide'
let view: View = 'Overview'
let connected = false
let modal = false
let notice = ''
let running = true

const repo = 'https://github.com/pablo2611/serverdock'

const alert = (message: string) => {
  notice = message
  render()
  window.setTimeout(() => { notice = ''; render() }, 3200)
}

const nav = () => (['Overview', 'Console', 'Files', 'Logs', 'Services', 'Guide'] as View[])
  .map(item => `<button class="nav-item ${view === item ? 'active' : ''}" data-view="${item}">${item}</button>`).join('')

const guide = () => `<section class="content-card guide">
  <div class="eyebrow">START HERE</div><h2>Launch ServerDock in four steps</h2>
  <p class="muted">The dashboard is hosted on Vercel. To manage a real VPS, deploy the included FastAPI service on that VPS first.</p>
  <ol>
    <li><b>Prepare the VPS.</b><span>Use Ubuntu 24.04, update it, and add a non-root administrator with an SSH key.</span></li>
    <li><b>Deploy the backend.</b><span>Clone this project on the VPS and configure the backend environment secrets described in the README.</span></li>
    <li><b>Protect the API.</b><span>Put it behind HTTPS, allow only your domain with CORS, and use a long JWT secret plus an encryption key.</span></li>
    <li><b>Connect from ServerDock.</b><span>Open “Connect VPS”, add the API address and SSH details, then verify the connection.</span></li>
  </ol>
  <div class="guide-actions"><a class="button secondary" href="${repo}" target="_blank" rel="noreferrer"><img src="https://github.githubassets.com/favicons/favicon-dark.svg" alt="" width="16" height="16">View project on GitHub</a><button class="button" data-connect>Connect VPS</button></div>
  <p class="security-note">Security note: never paste credentials into a public deployment until the backend HTTPS endpoint and environment secrets are configured.</p>
</section>`

const overview = () => !connected ? `<section class="welcome">
  <div><div class="eyebrow">SERVER MANAGEMENT</div><h2>Your VPS, under one secure control surface.</h2><p>Manage services, files, logs and terminal sessions after you connect a protected backend to your server.</p><div class="welcome-actions"><button class="button" data-connect>Connect VPS</button><button class="button secondary" data-view="Guide">Read setup guide</button></div></div>
  <div class="setup-panel"><span class="step-number">01</span><b>Connect your VPS</b><p>Use SSH credentials only after your ServerDock backend is installed and protected.</p><span class="step-number">02</span><b>Manage from one place</b><p>Console, files, service actions and logs become available after verification.</p></div>
</section>` : `<>
  <section class="status-card"><div><div class="eyebrow">CONNECTED SERVER</div><h2>pelisbot <span class="online">Online</span></h2><p>Ubuntu 24.04 · Last refresh just now</p></div><button class="button secondary" data-view="Console">Open console</button></section>
  <section class="metrics">${[['CPU','12%','4 cores'],['Memory','2.8 / 8 GB','35% in use'],['Disk','48.2 GB','111.8 GB free'],['Network','1.2 MB/s','Live traffic']].map(metric => `<article><small>${metric[0]}</small><b>${metric[1]}</b><span>${metric[2]}</span></article>`).join('')}</section>
  <section class="content-card"><div class="section-head"><div><div class="eyebrow">APPLICATION</div><h2>Telegram Bot</h2></div><span class="badge ${running ? 'success' : 'stopped'}">${running ? 'Running' : 'Stopped'}</span></div><p class="muted">telegram-bot.service</p><div class="actions"><button class="button compact" data-service="start">Start</button><button class="button secondary compact" data-service="restart">Restart</button><button class="button danger compact" data-service="stop">Stop</button></div></section>
</>`

const consoleView = () => `<section class="content-card terminal-card"><div class="section-head"><div><div class="eyebrow">INTERACTIVE SHELL</div><h2>SSH Console</h2></div><span class="badge ${connected ? 'success' : 'stopped'}">${connected ? 'Connected' : 'Not connected'}</span></div>${connected ? `<div class="terminal"><div class="terminal-bar"><span>serverdock · root@pelisbot</span><button data-notice="Console session refreshed">Refresh</button></div><pre><span class="dim">Last login: today via ServerDock</span>
<strong>root@pelisbot:~#</strong> systemctl status telegram-bot
<span class="good">● telegram-bot.service - Telegram Bot</span>
   Active: ${running ? '<span class="good">active (running)</span>' : '<span class="bad">inactive (dead)</span>'}

<strong>root@pelisbot:~#</strong> <span class="cursor"></span></pre></div><p class="security-note">This is the console layout. A live shell is enabled only when the WebSocket endpoint from the deployed backend is configured.</p>` : `<div class="empty"><b>Connect a VPS to open a terminal session.</b><p>Complete the setup guide first, then use the secure connection form.</p><button class="button" data-connect>Connect VPS</button></div>`}</section>`

const files = () => `<section class="content-card"><div class="section-head"><div><div class="eyebrow">FILE EXPLORER</div><h2>/app/telegram-bot</h2></div><button class="button secondary compact" data-notice="File actions require the deployed backend">Upload files</button></div><div class="file-list">${[['DIR','bot_data','Folder','4 min ago'],['FILE','bot.py','493 KB','1 hour ago'],['FILE','requirements.txt','36 B','15 May'],['ENV','.env','1.2 KB','Yesterday']].map(file => `<button data-notice="${file[1]} selected"><i>${file[0]}</i><b>${file[1]}</b><span>${file[2]}</span><span>${file[3]}</span></button>`).join('')}</div></section>`

const logs = () => `<section class="content-card"><div class="section-head"><div><div class="eyebrow">LIVE LOGS</div><h2>telegram-bot.service</h2></div><span class="badge success">Streaming</span></div><pre class="logs"><b>[INFO]</b> Bot started successfully
<b>[INFO]</b> Connected as @PelisMonitorBot
<b>[INFO]</b> User 58291 started a request
<b>[INFO]</b> New request processed
<span>Waiting for events…</span></pre></section>`

const services = () => `<section class="content-card"><div class="section-head"><div><div class="eyebrow">SYSTEM SERVICES</div><h2>Processes</h2></div><button class="button secondary compact" data-notice="Service list refreshed">Refresh</button></div>${['telegram-bot.service', 'nginx.service', 'ssh.service'].map((service, index) => `<div class="service-row"><div><b>${service}</b><span>${index === 0 ? 'Telegram bot' : 'System service'}</span></div><span class="badge success">Running</span></div>`).join('')}</section>`

const connectModal = () => !modal ? '' : `<div class="modal" role="dialog" aria-modal="true" aria-label="Connect VPS"><form id="connect-form"><button type="button" class="close" data-close aria-label="Close">×</button><div class="eyebrow">SECURE CONNECTION</div><h2>Connect your VPS</h2><p class="muted">Enter these details after the ServerDock backend is available through HTTPS.</p><label>Server name<input required value="My VPS"></label><label>Backend API URL<input required type="url" placeholder="https://panel.example.com"></label><div class="form-grid"><label>SSH user<input required value="root"></label><label>SSH port<input required value="22"></label></div><label>SSH private key<textarea required placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"></textarea></label><button class="button">Verify connection</button><p class="form-note">Credentials are never displayed again. Production use requires the backend encryption keys described in the guide.</p></form></div>`

function screen() {
  if (view === 'Guide') return guide()
  if (view === 'Console') return consoleView()
  if (view === 'Files') return files()
  if (view === 'Logs') return logs()
  if (view === 'Services') return services()
  return overview()
}

function render() {
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `<main><aside><a class="brand" href="#">Server<span>Dock</span></a><div class="project"><img src="https://github.githubassets.com/favicons/favicon-dark.svg" width="18" height="18" alt=""><a href="${repo}" target="_blank" rel="noreferrer">Project on GitHub</a></div><nav>${nav()}</nav><div class="sidebar-footer"><span class="dot"></span>Secure administration</div></aside><section class="page"><header class="topbar"><div><div class="eyebrow">CONTROL CENTER</div><h1>${view === 'Overview' ? 'VPS management' : view}</h1></div><button class="button" data-connect>Connect VPS</button></header>${notice ? `<div class="notice">${notice}</div>` : ''}${screen()}<footer>ServerDock · Personal VPS administration</footer></section></main>${connectModal()}`
  document.querySelectorAll<HTMLElement>('[data-view]').forEach(button => button.onclick = () => { view = button.dataset.view as View; render() })
  document.querySelectorAll<HTMLElement>('[data-connect]').forEach(button => button.onclick = () => { modal = true; render() })
  document.querySelectorAll<HTMLElement>('[data-close]').forEach(button => button.onclick = () => { modal = false; render() })
  document.querySelectorAll<HTMLElement>('[data-notice]').forEach(button => button.onclick = () => alert(button.dataset.notice!))
  document.querySelectorAll<HTMLElement>('[data-service]').forEach(button => button.onclick = () => { const action = button.dataset.service!; running = action === 'stop' ? false : true; alert(`Service ${action === 'restart' ? 'restarted' : action === 'stop' ? 'stopped' : 'started'}`) })
  document.querySelector<HTMLFormElement>('#connect-form')?.addEventListener('submit', event => { event.preventDefault(); modal = false; connected = true; view = 'Overview'; alert('Demo connection verified. Configure the backend API for a real VPS connection.') })
}

render()
