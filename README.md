# html-to-pdf

A lightweight Vercel serverless API that converts any URL to a PDF using headless Chromium. Supports configurable PDF options via query parameters and optional base64 response format.

## Endpoints

### `GET /api/html-to-pdf`

Navigates to the given URL with a headless browser and returns the rendered page as a PDF.

#### Query Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | **required** | The URL to convert to PDF |
| `responseFormat` | `base64` | — | Return PDF as a base64 JSON payload instead of a binary file |
| `format` | `PaperFormat` | `A4` | Paper size: `A0`–`A6`, `Letter`, `Legal`, `Tabloid`, `Ledger` |
| `landscape` | `true`/`false` | `false` | Landscape orientation |
| `printBackground` | `true`/`false` | `true` | Include CSS backgrounds and colors |
| `displayHeaderFooter` | `true`/`false` | `false` | Show browser-injected header/footer |
| `marginTop` | `string` | `20mm` | Top margin (e.g. `10mm`, `1in`) |
| `marginBottom` | `string` | `20mm` | Bottom margin |
| `marginLeft` | `string` | `15mm` | Left margin |
| `marginRight` | `string` | `15mm` | Right margin |
| `scale` | `number` | `1` | Page scale factor, clamped to `0.1`–`2` |
| `pageRanges` | `string` | all | Pages to include, e.g. `1-3` or `1,4-7` |
| `width` | `string` | — | Custom page width (overrides `format` when used with `height`) |
| `height` | `string` | — | Custom page height (overrides `format` when used with `width`) |

#### Responses

**Binary PDF** (default)
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="document.pdf"
```

**Base64 JSON** (`?responseFormat=base64`)
```json
{
  "pdf": "data:application/pdf;base64,..."
}
```

#### Error Responses

| Status | Description |
|---|---|
| `400` | Missing or invalid `url` parameter |
| `401` | Unauthorized — missing or invalid secret/origin |
| `403` | Page is protected by Cloudflare or similar challenge |
| `500` | Internal error (navigation timeout, render failure, etc.) |

#### Examples

```bash
# Basic — download as PDF
GET /api/html-to-pdf?url=https://example.com

# A4 landscape with no margins
GET /api/html-to-pdf?url=https://example.com&landscape=true&marginTop=0&marginBottom=0&marginLeft=0&marginRight=0

# Letter format, first 3 pages only, base64 response
GET /api/html-to-pdf?url=https://example.com&format=Letter&pageRanges=1-3&responseFormat=base64

# Custom dimensions
GET /api/html-to-pdf?url=https://example.com&width=210mm&height=297mm
```

## Authorization

All requests are validated by `withProxy`, which checks for one of:

- **Secret header**: `x-proxy-secret: <PROXY_SECRET>` — for server-to-server calls
- **Allowed origin/referer**: requests originating from an allowed origin are permitted — for browser clients

Preflight `OPTIONS` requests are always allowed (CORS).

## Environment Variables

| Variable | Description |
|---|---|
| `PROXY_SECRET` | Shared secret for `x-proxy-secret` header auth |
| `ALLOWED_ORIGIN` | Additional origin to whitelist (on top of `localhost:3000/3001`) |

## Local Development

```bash
npm install
npx vercel dev
```

Then call the API:

```bash
curl "http://localhost:3000/api/html-to-pdf?url=https://example.com" \
  -H "x-proxy-secret: your_secret" \
  --output document.pdf
```

## Deployment

```bash
npx vercel deploy
```

Set the required environment variables in your Vercel project dashboard or via CLI:

```bash
vercel env add PROXY_SECRET
vercel env add ALLOWED_ORIGIN
```

## Notes

- Pages protected by Cloudflare or similar bot-detection services will return a `403`
- `width` and `height` together override the `format` paper size
- A 2-second extra wait is applied after `networkidle0` to allow late JS rendering
- `media`, `websocket`, and `eventsource` requests are blocked during rendering to improve performance