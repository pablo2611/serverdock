# Security policy / Política de seguridad

## Security model / Modelo de seguridad

ServerDock must be deployed with HTTPS. Account passwords are hashed with bcrypt. SSH credentials are encrypted at rest with a dedicated Fernet key; server files, logs and backups must remain on the target VPS rather than being copied into the web panel.

ServerDock debe desplegarse con HTTPS. Las contraseñas de cuenta se almacenan con hash bcrypt. Las credenciales SSH se cifran en reposo con una clave Fernet dedicada; los archivos, logs y respaldos deben permanecer en el VPS objetivo, no copiarse al panel web.

## Required production controls / Controles obligatorios

- Set unique, high-entropy `JWT_SECRET` and `CONNECTION_ENCRYPTION_KEY` values in the host’s secret manager.
- Restrict `CORS_ORIGINS` to the exact Vercel domain.
- Use a non-root SSH user with narrowly scoped `sudo` permissions where possible.
- Prefer dedicated SSH keys. Never paste a private key into an issue, commit, chat, screenshot or public repository.
- Permit only an allowlist of systemd units; never build a shell command from an untrusted service name.
- Apply rate limiting to login and connection endpoints, enable audit logging and rotate secrets after a suspected exposure.
- Store backups on the VPS or an explicitly selected encrypted backup destination.

## Secrets checklist / Lista de secretos

The following values are secrets and must only be configured in the hosting platform:

- `JWT_SECRET`
- `CONNECTION_ENCRYPTION_KEY`
- Database URL or credentials
- SSH private keys and VPS passwords
- Kamatera API credentials, if API integration is later enabled

## Reporting / Reporte

Do not open a public issue with a vulnerability or secret. Contact the project owner privately with a minimal reproduction and affected version.
