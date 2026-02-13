<<<<<<< HEAD
# Expense Tracker Pro (Node.js + MongoDB + Clean UI)

## Features
- Register / Login (JWT)
- Add / List / Delete expenses (per user)
- Monthly stats:
  - Monthly total
  - Average expense
  - Top category
  - Charts (Chart.js via CDN)
- Monthly limit (budget) + alert when exceeded

## Setup
1) Copy env:
- Windows (PowerShell):
  `copy .env.example .env`
- macOS/Linux:
  `cp .env.example .env`

2) Edit `.env` and set:
- `MONGO_URI`
- `JWT_SECRET`

3) Install & run:
```bash
npm i
npm run dev
```

Open:
- http://localhost:3000

## Notes
- Frontend is served from `/public`
- API base:
  - `/api/auth`
  - `/api/user`
  - `/api/expenses`
  - `/api/stats`
=======
# money-track
>>>>>>> ad02b70d80cf2a81990fab18fc9cde5b1884eb00
