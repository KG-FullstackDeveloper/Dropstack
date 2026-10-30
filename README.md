# Dropstack Ecommerce

## Local development

The current application runs as a Vite client and a Node.js/Hono API using a
local SQLite database. Cloudflare deployment is a later migration; the
existing `wrangler.toml` is not the runtime configuration for this Node API.

1. Copy `server/.env.example` to `server/.env` and set a private `JWT_SECRET`,
   `OWNER_EMAIL`, and `OWNER_PASSWORD` (at least 12 characters).
2. In one terminal, run `npm install` and `npm run dev` from `server/`.
3. In another terminal, copy `client/.env.example` to `client/.env`, then run
   `npm install` and `npm run dev` from `client/`.
4. Open the Vite URL, normally `http://localhost:5173`. The API health check is
   `http://localhost:4000/api/health`.

Run the API regression tests with `npm test` from `server/`.
Create a consistent local SQLite backup with `npm run backup` from `server/`.
Backups go to `server/backups/` by default and keep the newest seven files;
set `BACKUP_DIRECTORY` or `BACKUP_KEEP` to customize this locally.

The SQLite file defaults to `server/dropstack.db`, independent of the shell's
working directory. Set `DATABASE_PATH` in `server/.env` to use another local
file. The server applies additive migrations on startup; do not run SQL reset
scripts against a database containing business data.

`VITE_API_URL` is the API origin, without `/api` (for local development:
`http://localhost:4000`).
Market detection uses the request IP and daily reference exchange rates; local
testing can override the detected market using the commented `MARKET_TEST_*`
values in `server/.env.example`. Rates are indicative display/estimate rates,
not guaranteed payment-settlement rates.

## Before accepting real orders

- Configure and test SMTP using `server/.env.example` as a reference.
- For product image/video uploads, create a Cloudinary free account and set
  `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
  `CLOUDINARY_API_SECRET` in `server/.env`. The API secret stays server-side.
- Replace the placeholder domain in the client sitemap, robots file, and Open
  Graph metadata; review the store policies for the countries where you sell.
- Select and verify a supplier workflow, delivery promises, return handling,
  and off-device backups.
- Complete and test payment integration before taking live orders.

Local SQLite is appropriate while building and testing. Moving to Cloudflare
requires an intentional runtime/data-layer migration; the current API imports
`better-sqlite3` and starts with `@hono/node-server`, while Cloudflare D1 uses a
different database adapter and deployment entrypoint.
