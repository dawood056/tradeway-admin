# TradeWay Admin Panel (Client)

This Vite/React app powers the TradeWay marble marketplace's admin console. It ships dashboards for orders, pricing, and forecasting plus tooling for evaluating marketplace actors.

## Getting started

```powershell
cd client/tradeway-admin
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in a `.env` file (defaults to `http://localhost:5000`) so the client can talk to the Express backend.

## Available scripts

| Command           | Purpose                               |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Start Vite dev server with hot reload |
| `npm run build`   | Create a production build in `dist/`  |
| `npm run preview` | Serve the production build locally    |
| `npm run lint`    | Run ESLint across the project         |

## Driver verification workflow

The **Driver Verification** page lets administrators review transport driver submissions (name, CNIC, license info) and approve or reject access to the logistics app. Analysts can filter and search submissions but only admins see the action buttons. Approvals automatically flag the driver record as verified on the backend; rejections capture a note to help ops teams coach drivers on what to fix.

Ensure the backend is running (see `/server`) so API calls to `/api/admin/driver-verifications` succeed.
