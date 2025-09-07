
# PWA + Google Sheets (Apps Script) — v3 (EN/AR + Price + Mark Sold)
- EN/AR bilingual UI with toggle and dynamic RTL/LTR.
- Market price field + client-side filters (country, min/max).
- Mark as Sold (hides sold items) — new `markSold` action.
- Footer: © 2025.  Service worker cache: `cards-pwa-v3`.

## Sheets
- `cards`: `code, holderName, country, status, notes, contact`
- `affiliates`: auto header on first write
- `market`: `timestamp, code, country, contact, price, isSold, soldAt`

## Apps Script
- Paste `apps_script_code.gs`, set `SHEET_ID`, Deploy as Web app (Execute as Me / Anyone).

## Frontend
- Set `GAS_URL` in `app.js` or run `setGASUrl('<WEB_APP_URL>')` in console.
- Use filters and mark sold from the Market tab.
