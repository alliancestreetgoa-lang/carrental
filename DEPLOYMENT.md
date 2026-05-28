# Alliance Car Rental — Deployment Guide

## Overview

The project is split into two independently deployable apps:

| App | Directory | Technology |
|-----|-----------|------------|
| **Backend** | `apps/backend` | Express + Prisma + PostgreSQL + Socket.IO (TypeScript) |
| **Frontend** | `apps/frontend` | Next.js 16 (App Router) |

**Why the split?** Socket.IO requires a **persistent, long-lived server process** that keeps WebSocket connections alive. Serverless platforms (Vercel, Netlify Functions) terminate after each request and cannot host Socket.IO. The backend must run on a platform that keeps the process alive (Render Web Service, Railway, VPS).

The frontend is a standard Next.js app and can be deployed anywhere — Vercel is the natural choice.

---

## Prerequisites

- Node 20+
- PostgreSQL 14+ (managed or self-hosted)
- (Optional) Docker + Docker Compose for VPS / local prod

---

## Environment Variable Reference

### Backend (`apps/backend/.env`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string |
| `JWT_SECRET` | **Yes** | Min 32 chars; signs auth tokens |
| `JWT_EXPIRES_IN` | No (default `7d`) | Token lifetime |
| `PORT` | No (default `4000`) | HTTP listen port |
| `NODE_ENV` | No (default `development`) | `production` in prod |
| `FRONTEND_URL` | **Yes in prod** | CORS allowed origin + link base URL |
| `CLOUDINARY_CLOUD_NAME` | Optional | Image/doc upload; 503 until set |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary auth |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary auth |
| `RAZORPAY_KEY_ID` | Optional | Payment gateway; mock mode until set |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay auth |
| `STRIPE_SECRET_KEY` | Optional | Stripe payments |
| `SMTP_HOST` | Optional | Email via nodemailer; console log until set |
| `SMTP_PORT` | Optional | SMTP port (e.g. 587) |
| `SMTP_USER` | Optional | SMTP username |
| `SMTP_PASS` | Optional | SMTP password |
| `SMTP_FROM` | Optional | From address for outgoing mail |
| `WHATSAPP_TOKEN` | Optional | WhatsApp Business API |
| `SMS_PROVIDER` | Optional | SMS gateway identifier |

### Frontend (`apps/frontend/.env.local`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_API_URL` | **Yes** | Backend REST base URL (e.g. `https://api.example.com/api`) |
| `NEXT_PUBLIC_SOCKET_URL` | **Yes** | Backend Socket.IO root URL (e.g. `https://api.example.com`) |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical frontend URL |

> **Important:** `NEXT_PUBLIC_*` vars are **inlined at build time** by Next.js. Changing them after a build has no effect — you must trigger a new build.

---

## Platform Guides

### Vercel (Frontend)

1. Import the repo into Vercel.
2. Set **Root Directory** to `apps/frontend`.
3. Framework Preset will auto-detect **Next.js**.
4. Add environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_API_URL` → your backend URL + `/api`
   - `NEXT_PUBLIC_SOCKET_URL` → your backend URL (no path)
   - `NEXT_PUBLIC_SITE_URL` → your Vercel domain
5. Deploy. Vercel handles builds, previews, and CDN automatically.

A minimal `vercel.json` is included at `apps/frontend/vercel.json`; it just declares the framework so Vercel skips auto-detection guessing.

---

### Render (Backend + Frontend + Postgres)

A **Render Blueprint** (`render.yaml` at the repo root) defines all three resources. To use it:

1. Go to **Render Dashboard → New → Blueprint**.
2. Connect your GitHub repo and select the `render.yaml` file.
3. Render will create:
   - A managed **PostgreSQL** database (`alliance-db`)
   - A **Web Service** for the backend (`alliance-backend`)
   - A **Web Service** for the frontend (`alliance-frontend`)
4. After the first deploy, set the `sync: false` env vars in the Render dashboard:
   - On `alliance-backend`: `FRONTEND_URL` = your frontend URL
   - On `alliance-frontend`: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_SITE_URL`
5. Trigger a redeploy of the frontend after setting `NEXT_PUBLIC_*` (they are build-time).

**Manual setup (without Blueprint):**

1. Create a **PostgreSQL** database in Render; copy the connection string.
2. Create a **Web Service**:
   - Root Directory: `apps/backend`
   - Build: `npm install && npm run build`
   - Start: `npm start` (runs `prisma migrate deploy` then `node dist/index.js`)
   - Health check path: `/health`
3. Set the backend env vars listed above.
4. Create a second **Web Service** for the frontend similarly.

---

### Railway (Backend + Frontend + Postgres)

Railway auto-builds via **Nixpacks** — no Dockerfile needed.

1. Create a new **Project** in Railway.
2. Add a **PostgreSQL** plugin; copy the `DATABASE_URL` it provides.
3. Add a **Service** for the backend:
   - Source: your repo, root path `apps/backend`
   - Start command: `npm start`
   - Set env vars: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`
4. Add a **Service** for the frontend:
   - Source: your repo, root path `apps/frontend`
   - Build command: `npm run build`; start: `npm start`
   - Set env vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_SITE_URL`
   - Trigger a redeploy after setting `NEXT_PUBLIC_*` vars (build-time).
5. Expose public domains for both services in the Railway dashboard.

---

### VPS (Docker Compose)

A `docker-compose.yml` at the repo root orchestrates Postgres + backend + frontend.

```bash
# 1. Clone and enter the repo
git clone <your-repo> alliance-car-rental
cd alliance-car-rental

# 2. Edit docker-compose.yml:
#    - Set POSTGRES_PASSWORD and DATABASE_URL password to something strong
#    - Set JWT_SECRET to a random 32+ char string
#    - Set NEXT_PUBLIC_* build args to your real domain(s)
#    - Set FRONTEND_URL on the backend to your frontend domain

# 3. Build and start
docker compose up -d --build

# 4. Check logs
docker compose logs -f backend
```

The backend automatically runs `prisma migrate deploy` on startup.

#### nginx reverse proxy (recommended)

Install nginx and certbot, then create `/etc/nginx/sites-available/alliance`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass         http://localhost:3000;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # Backend REST API + Socket.IO
    location /api/ {
        proxy_pass         http://localhost:4000;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass         http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable and reload nginx
ln -s /etc/nginx/sites-available/alliance /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Obtain SSL certificate
certbot --nginx -d your-domain.com -d www.your-domain.com
```

#### PM2 (alternative to Docker on VPS)

```bash
# Backend
cd apps/backend && npm install && npm run build
pm2 start dist/index.js --name alliance-backend

# Frontend
cd apps/frontend && npm install && npm run build
pm2 start npm --name alliance-frontend -- start

pm2 save && pm2 startup
```

---

## Post-Deploy Steps

1. **Migrations** — automatically run via `npm start` (`prisma migrate deploy`). No manual step needed.
2. **Seed data** (optional) — `cd apps/backend && npm run prisma:seed`
3. **Set real domains** — update `FRONTEND_URL` on the backend and `NEXT_PUBLIC_*` on the frontend, then redeploy both.
4. **Enable optional integrations** — set Cloudinary, Razorpay/Stripe, SMTP, WhatsApp env vars.

---

## Production Checklist

- [ ] `JWT_SECRET` is at least 32 random characters (never a dictionary word).
- [ ] HTTPS is enabled on all public domains.
- [ ] `FRONTEND_URL` is set to the exact frontend origin (no trailing slash) for correct CORS.
- [ ] Default seed admin password has been changed after first login.
- [ ] `NODE_ENV=production` is set on the backend.
- [ ] Database is not publicly accessible (only the backend connects to it).
- [ ] Backups are enabled on the managed Postgres (Render/Railway handle this; configure on VPS).
