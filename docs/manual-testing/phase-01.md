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

*Tasks 1.2–1.5 recipes will be appended here as each task merges.*
