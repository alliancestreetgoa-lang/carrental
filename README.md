# Alliance Car Rental

Production-ready Rent-a-Car Management System with a premium SaaS dashboard.

## Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, ShadCN UI, Zustand, React Hook Form + Zod, Recharts, FullCalendar
- **Backend**: Node.js, Express, Socket.IO
- **Database**: PostgreSQL, Prisma ORM
- **Auth**: JWT (httpOnly cookies)
- **Uploads**: Cloudinary · **PDF**: PDFKit

## Project Structure

```
alliance-car-rental/
├── package.json          # npm workspaces + dev scripts
└── apps/
    ├── frontend/         # Next.js App Router dashboard
    │   └── src/
    │       ├── app/           # routes: (auth)/login, (dashboard)/*
    │       ├── components/     # ui/, layout/, dashboard/, shared/
    │       ├── lib/            # api client, utils
    │       ├── stores/         # Zustand auth + ui stores
    │       ├── hooks/          # useSocket
    │       └── providers/      # Theme, Auth, Socket providers
    └── backend/          # Express API + Socket.IO
        ├── prisma/            # schema + seed
        └── src/
            ├── routes/        # auth, dashboard, fleet, customers, reservations
            ├── controllers/
            ├── services/
            ├── middleware/    # auth, error
            └── lib/           # prisma client, jwt
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ running locally

### Setup

1. Install dependencies (from repo root):
   ```bash
   npm install
   ```

2. Configure backend environment — copy and edit `DATABASE_URL`:
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```

3. Configure frontend environment:
   ```bash
   cp apps/frontend/.env.local.example apps/frontend/.env.local
   ```

4. Run database migration and seed:
   ```bash
   cd apps/backend
   npx prisma migrate dev --name init
   npm run prisma:seed
   cd ../..
   ```

5. Start both servers together:
   ```bash
   npm run dev
   ```

   Or individually:
   ```bash
   npm run dev:backend    # http://localhost:4000
   npm run dev:frontend   # http://localhost:3000
   ```

6. Open http://localhost:3000

### Default Login

- Email: `admin@alliancecarrental.com`
- Password: `admin123`

## API Endpoints

All endpoints are prefixed with `/api` and (except auth login/logout) require a JWT cookie.

| Method | Path | Description |
|--------|------|-------------|
| POST   | `/api/auth/login` | Sign in, sets httpOnly JWT cookie |
| POST   | `/api/auth/logout` | Clear session |
| GET    | `/api/auth/me` | Current user |
| GET    | `/api/dashboard/stats` | Dashboard KPIs + recent reservations |
| GET/POST | `/api/fleet` | List / create cars |
| GET/PATCH/DELETE | `/api/fleet/:id` | Car detail / update / delete |
| GET/POST | `/api/customers` | List / create customers |
| GET/PATCH/DELETE | `/api/customers/:id` | Customer detail / update / delete |
| GET/POST | `/api/reservations` | List / create reservations |
| PATCH  | `/api/reservations/:id/status` | Update reservation status |

## Notes

- The frontend uses the new ShadCN **Base UI** component registry.
- Dark/light mode via `next-themes`; toasts via `sonner`.
- The dashboard revenue chart currently uses sample data; wire it to a real endpoint when month-over-month aggregation is added.
