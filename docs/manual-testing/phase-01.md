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

See the **Phase 1 End-to-End Recipe** (Task 1.5 section below) for the
complete two-Worker setup. Tasks 1.3 and 1.4 use the same setup.

---

## Task 1.4 — Structured Logging

Log format and setup are identical to Task 1.3. See the Phase 1 End-to-End
Recipe (Task 1.5 section below).

---

## Task 1.5 — Phase 1 End-to-End Recipe

This is the definitive recipe for verifying the full Phase 1 proxy stack.
Run it after all tasks (1.1–1.5) have merged.

### Prerequisites

- `node` ≥ 20, `npm`, and `wrangler` installed globally (or use `npx wrangler`)
- `jq` installed (for readable JSON output)
- Two terminal windows available

### Step 1 — Install all dependencies

```bash
# From repo root
npm ci

# Install dummy-origin deps (included in npm run verify but good to be explicit)
cd workers/dummy-origin && npm ci && cd ../..
```

### Step 2 — Verify the automated test suite

```bash
npm run verify
# Expected: exits 0
# Lint: clean
# Typecheck: clean
# Tests: 30 passed (19 payload-extractor + 5 waf-handler + 6 logger)
# Boundary guard: 1 violation flagged correctly
# Dummy-origin tests: 6 passed
```

### Step 3 — Start the dummy origin (terminal 1)

```bash
# Port 8788: leaves 8787 free for Aegis
npm run dev:dummy-origin
```

Wait for the line: `Ready on http://localhost:8788`

### Step 4 — Start the Aegis Worker (terminal 2)

```bash
# From repo root — port 8787 (default)
npm run dev
```

Wait for the line: `Ready on http://localhost:8787`

> **How service bindings work locally:** wrangler dev maintains a local
> Worker registry. When Aegis calls `env.ORIGIN.fetch(...)`, wrangler
> routes it to the locally running "dummy-origin" Worker automatically —
> no manual URL wiring required.

### Step 5 — Smoke-test the proxy

Run these in a third terminal (or any shell where the two Workers are already running):

```bash
# Phase exit criterion: echo hello through the proxy
curl -s "http://localhost:8787/echo?q=hello" | jq .
# Expected: {"echo":"hello"}

# Health check forwarded
curl -s http://localhost:8787/health | jq .
# Expected: {"status":"ok"}

# POST with JSON body forwarded
curl -s -X POST http://localhost:8787/search \
  -H "Content-Type: application/json" \
  -d '{"query":"sql injection"}' | jq .
# Expected: {"query":"sql injection","results":[]}

# Unknown route — origin 404 forwarded unchanged
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8787/unknown
# Expected: 404
```

### Step 6 — Inspect the structured log

Switch to the **Aegis terminal** (terminal 2). After each curl you should see
a JSON line like:

```json
{
  "ts":        "2026-04-23T12:34:38.104Z",
  "reqId":     "f1bf25e7-a1cb-417a-9c51-5f3c6091ee46",
  "method":    "GET",
  "path":      "/echo",
  "verdict":   "ALLOW",
  "latencyMs": 6
}
```

Confirm:
- `ts` is a valid ISO 8601 timestamp
- `reqId` is a UUID (different for every request)
- `method` and `path` match what you sent
- `verdict` is `"ALLOW"` (no classifier yet)
- `latencyMs` is a non-negative integer

### Phase 1 exit criteria checklist

- [ ] `npm run verify` exits 0
- [ ] `curl localhost:8787/echo?q=hello` returns `{"echo":"hello"}`
- [ ] Aegis terminal shows a log line with `"verdict":"ALLOW"`
- [ ] `latencyMs` is present and numeric in every log line
