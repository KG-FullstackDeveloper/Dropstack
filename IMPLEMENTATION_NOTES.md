# Implementation notes — October 2026

## Implemented in this pass
- `/shop` and `/product/:id` now request products from the backend API instead of importing the hard-coded product list.
- The global store no longer substitutes demo products when the API returns no active products; product imagery no longer silently uses unrelated demo images.
- The homepage's main shopping action points to `/shop`; public admin-login links were removed from the homepage.
- Added a proper 404 page and customer trust/tracking pages, with footer links.
- Added default title/description/Open Graph tags and robots/sitemap templates. Replace `YOUR-PRODUCTION-DOMAIN` and the Open Graph URL before deployment.
- Admin Products is now a responsive card grid, with selection, edit/delete actions, price, stock and estimated profit.
- Product modal supports JPG/PNG/WebP image selection with a 5 MB client limit; server validates uploaded data-URI image type/size too. This implementation stores uploaded image data in the product record, so a dedicated object-storage upload service is still recommended before handling many/large images.
- Added Store Content navigation/page scaffold. It explicitly says persistence is not connected rather than pretending changes are saved. Existing Stores page still uses local demo state and needs a database-backed stores API.
- Added best-effort order-received, new-order, shipping/tracking and new-login notification emails. Configure SMTP and `STORE_OWNER_EMAIL` in `.env`; email errors are logged without aborting checkout/login.
- Added Hono secure headers, in-process rate limits for checkout, tracking, visitor geolocation and market detection, a daily SQLite backup scheduler, and an authenticated-email order tracking endpoint.
- Checkout now rejects empty/invalid carts and computes shipping from the server's shipping rules rather than trusting the client shipping fee.
- Marked 2FA as unavailable/not enforced in the Profile UI.
- Added Framer Motion product-card hover, cart drawer/toast motion with reduced-motion support.
- Removed `client/src/services/adminApi.backup.ts` and removed owner email from a startup database log.
- Added `server/.env.example`; actual `.env`, database files, `.git` and `node_modules` are excluded from the deliverable ZIP.

## Still pending / not verified
- Payment integration is intentionally not implemented in this pass, as requested to do it after the other work.
- Analytics chart redesign (revenue area/line, orders bars, conversion funnel, top-products horizontal bars) is not completed.
- Store Management still needs a real database-backed store list/create/edit flow; Store Content persistence is not connected.
- Trust-page text edits are a local development preview only, not database-persisted. Review all policy text with the actual supplier and jurisdictions before launch.
- Sitemap and Open Graph canonical URL require the real production domain.
- Daily backups run only while the API process is running; configure external/off-host backup retention for production.
- Rate limiting is in-memory and suitable only for a single API process; use shared storage if running multiple instances.
- Frontend TypeScript check and backend TypeScript check passed. Vite production build could not run in this Linux environment because the ZIP's preinstalled `node_modules` lacked the Linux Rollup optional binary. The API server could not be started here because its preinstalled esbuild binary was for Windows. Reinstall dependencies on the target OS (`npm ci` in `client` and `server`) before running `npm run build` and `npm run dev`.
