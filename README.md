# ServerDock

> Personal cloud control panel for Linux VPS servers — created and maintained by **Pablo Sánchez**.
>
> Panel personal en la nube para administrar servidores VPS Linux — creado y mantenido por **Pablo Sánchez**.

ServerDock is a bilingual (English / Español) administration panel designed to manage a Linux VPS from a browser. It keeps server files on the VPS: the platform only retains account information and encrypted connection metadata needed to reconnect.

ServerDock es un panel de administración bilingüe (English / Español) para gestionar un VPS Linux desde el navegador. Los archivos permanecen en el VPS: la plataforma únicamente conserva la cuenta y los metadatos de conexión cifrados necesarios para reconectar.

## Features / Funciones

- VPS onboarding with host, SSH port, user and SSH-key authentication.
- Resource dashboard: CPU, memory, disk, network and uptime.
- File, terminal, log and system-service management surfaces.
- Account-backed saved server configuration.
- Responsive dark interface inspired by professional server panels.

## Cloud deployment / Despliegue en la nube

No local background process is required.

- **GitHub:** source code and version history.
- **Vercel:** static frontend.
- **Managed backend:** FastAPI service (Render, Railway, Fly.io or a dedicated VPS).
- **Persistent database:** managed PostgreSQL is recommended for production; SQLite is suitable only for a single-instance initial deployment.

No se requiere ningún proceso en segundo plano en el PC.

## Security / Seguridad

Read [SECURITY.md](SECURITY.md) before deployment. Never commit `.env`, private SSH keys, passwords, access tokens, or production database files. The provided `.env.example` contains placeholders only.

Lee [SECURITY.md](SECURITY.md) antes de desplegar. Nunca subas `.env`, claves privadas SSH, contraseñas, tokens de acceso ni bases de datos de producción. El archivo `.env.example` contiene únicamente valores de ejemplo.

## Development / Desarrollo

```text
frontend/  TypeScript + Vite user interface
backend/   FastAPI API, authentication and encrypted server metadata
```

Use `frontend/` with `npm install && npm run build`. Deploy `backend/` with production environment variables set by the hosting provider; do not use development defaults in production.

## License / Licencia

Private project by Pablo Sánchez. All rights reserved unless a license is added later.
