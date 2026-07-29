# ServerDock

Panel personal de administración para VPS Linux: dashboard de recursos, gestor de archivos, terminal, logs y controles de servicios. El frontend está diseñado en TypeScript y el backend FastAPI está preparado para desplegarse en Ubuntu.

## Arranque local

1. Frontend: `cd frontend && npm install && npm run dev`
2. Backend: copia `backend/.env.example` a `backend/.env`, ajusta las variables y ejecuta `uvicorn app.main:app --app-dir backend --reload`.

## Producción

No expongas el backend directamente: pon Nginx/Caddy con HTTPS delante, define un `JWT_SECRET` único y limita `CORS_ORIGINS` a tu dominio. Ejecuta el backend con un usuario sin privilegios; el control de systemd debe permitirse solo para las unidades explícitamente autorizadas.
