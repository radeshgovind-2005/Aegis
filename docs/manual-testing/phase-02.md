# Phase 2 Manual-Test Recipes

These recipes verify Phase 2 tasks. Because Phase 2 is a pure domain layer
(no Cloudflare bindings, no Worker runtime), every recipe is a local Node test
run — no `wrangler dev` needed.

---

## Task 2.0 — Split test environments for coverage

### 1. Verify the split configs exist

```bash
ls vitest.config.mts vitest.unit.config.mts
# Expected: both files present
```

### 2. Run the unit pool alone

```bash
npm run test:unit
# Expected: exits 0
# Test files under test/domain/, test/application/, test/ports/ run in Node env.
```

### 3. Run the workers pool alone

```bash
npm run test:workers
# Expected: exits 0
# test/interfaces/ and test/ (integration) run in workerd via Miniflare.
```

### 4. Run coverage

```bash
npm run test:coverage
# Expected: exits 0, coverage table printed to stdout.
# No "node:inspector not implemented" error.
```

### 5. Confirm domain tests are excluded from the workers pool

```bash
# The workers pool should NOT include domain spec files.
# If you see test/domain/... files in the workers-pool output, the exclude
# list in vitest.config.mts is broken.
npm run test:workers 2>&1 | grep "domain"
# Expected: no domain spec filenames in the output.
```

---

## Task 2.1 — `Payload` value object

### 1. Run the unit tests

```bash
npm run test:unit
# Expected: exits 0
# test/domain/payload/payload.spec.ts: 15 tests passed
# test/domain/payload/payload-extractor.spec.ts: 19 tests passed
```

### 2. Check coverage

```bash
npm run test:coverage
# Expected:
#   payload.ts          | 100 | 100 | 100 | 100
#   payload-extractor.ts| 100 | 100 | 100 | 100
```

### 3. Verify the ESLint boundary rule still holds

```bash
npm run test:boundary
# Expected: PASS: hexagonal boundary rule flagged 1 violation(s) correctly.
```

### 4. Quick REPL smoke-test (optional but instructive)

```bash
node --input-type=module <<'EOF'
import { Payload, PayloadValidationError, MAX_PAYLOAD_LENGTH } from
  "./src/domain/payload/payload.js";

// Construction
const p = new Payload("SELECT * FROM users WHERE id = 1 OR '1'='1'");
console.log("value:", p.value);

// Normalization
console.log("normalized:", p.normalize());
// Expected: "select * from users where id = 1 or '1'='1'"
// Note: single-quotes preserved — special chars are NOT stripped.

// URL-encoded probe
const encoded = new Payload("foo%3Dbar%20baz");
console.log("url-decoded:", encoded.normalize());
// Expected: "foo=bar baz"

// Validation errors
try { new Payload(""); }
catch (e) { console.log("empty throws:", e.constructor.name); }
// Expected: empty throws: PayloadValidationError

try { new Payload("x".repeat(MAX_PAYLOAD_LENGTH + 1)); }
catch (e) { console.log("too-long throws:", e.constructor.name); }
// Expected: too-long throws: PayloadValidationError
EOF
```

> Note: the REPL requires the TypeScript to be compiled first (`tsc`) or
> use `tsx` if you prefer: `tsx --eval '...'`. The snippet above uses
> the compiled `.js` output path. For a quicker check just trust the
> vitest run above — the tests cover every path.

### 5. Full verify

```bash
npm run verify
# Expected: exits 0
# Lint: clean (no cloudflare imports in src/domain/)
# Typecheck: clean
# Tests: 34 unit + 11 workers = 45 total passed
# Boundary guard: PASS
# Dummy-origin tests: 6 passed
```

### Phase 2 (partial) exit criteria checklist

Tasks 2.1 only — update this list as later tasks land.

- [ ] `npm run verify` exits 0
- [ ] `npm run test:coverage` shows `payload.ts` at 100% line coverage
- [ ] `grep -rE '(cloudflare:|@cloudflare/)' src/domain/` returns nothing
- [ ] `new Payload("")` throws `PayloadValidationError`
- [ ] `new Payload("SELECT 1").normalize()` returns `"select 1"`
