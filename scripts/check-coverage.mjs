#!/usr/bin/env node
/**
 * Fails if coverage thresholds are not met.
 * Reads coverage/coverage-summary.json (produced by vitest --coverage).
 *
 * Thresholds:
 *   - src/domain/      line ≥ 95%
 *   - src/application/ line ≥ 90%
 *   - src/adapters/    line ≥ 80%
 *
 * Before Phase 2 there is no domain code; this script no-ops if the
 * relevant paths are absent.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SUMMARY = resolve('coverage/coverage-summary.json');

if (!existsSync(SUMMARY)) {
  console.log('[check-coverage] no coverage summary found, skipping.');
  process.exit(0);
}

/** @type {Record<string, { lines: { pct: number } }>} */
const summary = JSON.parse(readFileSync(SUMMARY, 'utf8'));

const thresholds = [
  { prefix: 'src/domain/', min: 95 },
  { prefix: 'src/application/', min: 90 },
  { prefix: 'src/adapters/', min: 80 },
];

let failed = false;

for (const { prefix, min } of thresholds) {
  const files = Object.entries(summary).filter(
    ([k]) => k !== 'total' && k.includes(prefix),
  );
  if (files.length === 0) {
    console.log(`[check-coverage] ${prefix}: no files yet, skipping.`);
    continue;
  }
  const totalLines = files.reduce((a, [, v]) => a + v.lines.pct, 0);
  const avg = totalLines / files.length;
  if (avg < min) {
    console.error(
      `[check-coverage] FAIL: ${prefix} avg line coverage ${avg.toFixed(1)}% < ${min}%`,
    );
    failed = true;
  } else {
    console.log(
      `[check-coverage] OK:   ${prefix} avg line coverage ${avg.toFixed(1)}% (>= ${min}%)`,
    );
  }
}

process.exit(failed ? 1 : 0);
