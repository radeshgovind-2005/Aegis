# Phase 1 Manual-Test Recipes

These recipes verify Phase 1 tasks end-to-end. Run them in order after each task merges.

---

## Task 1.1 — Dummy Origin Worker

**Prerequisites:** `node` ≥ 20, `npm` installed.

### 1. Install and verify

```bash
# From repo root
npm ci

# Install dummy-origin deps
cd workers/dummy-origin && npm ci && cd ../..

# Full verify (lint + typecheck + all tests)
npm run verify
# Expected: exits 0. dummy-origin tests: 6 passed.
```

### 2. Run the dummy origin locally

```bash
cd workers/dummy-origin
npm run dev
# Wrangler starts on http://localhost:8787
```

### 3. Smoke-test each endpoint

Open a second terminal:

```bash
# GET /health → 200 {"status":"ok"}
curl -s http://localhost:8787/health | jq .
# Expected: {"status":"ok"}

# GET /echo?q=hello → 200 {"echo":"hello"}
curl -s "http://localhost:8787/echo?q=hello" | jq .
# Expected: {"echo":"hello"}

# GET /echo (no q) → 400
curl -s -o /dev/null -w "%{http_code}" http://localhost:8787/echo
# Expected: 400

# POST /search → 200 with results array
curl -s -X POST http://localhost:8787/search \
  -H "Content-Type: application/json" \
  -d '{"query":"sql injection"}' | jq .
# Expected: {"query":"sql injection","results":[]}

# POST /search (invalid JSON) → 400
curl -s -o /dev/null -w "%{http_code}" \
  -X POST http://localhost:8787/search \
  -H "Content-Type: application/json" \
  -d 'not-json'
# Expected: 400

# Unknown route → 404
curl -s -o /dev/null -w "%{http_code}" http://localhost:8787/unknown
# Expected: 404
```

### 4. Check Content-Type headers

```bash
curl -sI http://localhost:8787/health | grep -i content-type
# Expected: content-type: application/json
```

---

## Task 1.3 — HTTP Handler: Pass-Through Mode

**Prerequisites:** Both Workers running simultaneously — two terminals.

### 1. Start the dummy origin (terminal 1)

```bash
cd workers/dummy-origin
npm run dev
# Wrangler starts on http://localhost:8787 (or next free port)
# Note the port — you may need to configure dummy-origin's port explicitly
# if 8787 is taken. For now use the default.
```

### 2. Start the Aegis Worker (terminal 2)

```bash
# From repo root
npm run dev
# Wrangler starts on http://localhost:8787 (if dummy-origin is on 8787,
# Aegis will take 8788 or vice versa — check each terminal's output).
# IMPORTANT: wrangler dev resolves service bindings to the locally running
# dummy-origin Worker automatically when both are started with wrangler dev.
```

### 3. Send requests through the Aegis proxy

Replace `<AEGIS_PORT>` with the port Aegis is listening on.

```bash
# GET /health — forwarded to origin, returns {"status":"ok"}
curl -s http://localhost:<AEGIS_PORT>/health | jq .
# Expected: {"status":"ok"}

# GET /echo?q=hello — forwarded, returns {"echo":"hello"}
curl -s "http://localhost:<AEGIS_PORT>/echo?q=hello" | jq .
# Expected: {"echo":"hello"}

# POST /search — forwarded with JSON body
curl -s -X POST http://localhost:<AEGIS_PORT>/search \
  -H "Content-Type: application/json" \
  -d '{"query":"sql injection"}' | jq .
# Expected: {"query":"sql injection","results":[]}

# Unknown route — origin 404 forwarded unchanged
curl -s -o /dev/null -w "%{http_code}" http://localhost:<AEGIS_PORT>/unknown
# Expected: 404
```

### 4. Inspect the log output

In the **Aegis terminal** (terminal 2) you should see a JSON log line for each
request, e.g.:

```json
{"ts":"2026-04-23T12:34:38.104Z","reqId":"f1bf25e7-...","method":"GET","path":"/echo","verdict":"ALLOW","latencyMs":6}
```

Confirm all six fields are present: `ts`, `reqId`, `method`, `path`,
`verdict` (always `"ALLOW"` for now), `latencyMs` (non-negative integer).

### 5. Automated check

```bash
# From repo root — must exit 0
npm run verify
# Expected: lint clean, typecheck clean, 24 tests passed (19 payload + 5 handler).
```
