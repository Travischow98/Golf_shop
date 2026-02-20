# Fairway Club Storefront

Modern youth-oriented golf e-commerce site inspired by Malbon-style retro streetwear.

## What is included
- Sticky header with bag icon and selected item count
- High-impact hero section with forest + slate visual direction
- Responsive product grid and streamlined checkout form
- Backend order processing endpoint that stores orders and increments an `orderCount` on every successful order
- Webhook integration that sends Name, Email, Phone, Products, and Order Count to your Google Sheet flow

## Run locally
```bash
npm install
cp .env.example .env
npm start
```
Then open `http://localhost:3000`.

## Environment config
Set these in `.env`:
- `PORT=3000`
- `ADMIN_KEY=change-me`
- `GOOGLE_APPS_SCRIPT_WEBHOOK=https://script.google.com/macros/s/your-deployment-id/exec`

## Google Sheet integration for plugo.hk@gmail.com
1. Open `script.google.com` with your Google account.
2. Create a new Apps Script and paste `docs/google-apps-script.js`.
3. Deploy as **Web App** with access set to **Anyone with the link**.
4. Add deployment URL to `GOOGLE_APPS_SCRIPT_WEBHOOK` in `.env`.

The script auto-creates the `Golf Shop Orders` sheet (if missing), appends every incoming order row, and grants edit access to `plugo.hk@gmail.com`.

## API quick reference
- `GET /api/products` -> product catalog
- `GET /api/orders/summary` -> total order count and revenue
- `POST /api/orders` -> place order
- `GET /api/orders` -> admin-only (send header `x-admin-key`)
