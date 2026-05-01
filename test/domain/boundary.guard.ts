/**
 * Hexagonal boundary guard.
 *
 * Regression coverage for the `no-restricted-imports` ESLint rule in
 * .eslintrc.cjs. Verifies that every forbidden import pattern listed in
 * task 2.4 is correctly wired to fail when used inside src/domain/.
 *
 * This is NOT a red-green-refactor TDD cycle — the rule was added in
 * task 0.1 and extended in task 2.4. This script provides automated
 * regression coverage so that removing or misconfiguring the rule causes
 * `npm run verify` to fail.
 *
 * Run standalone: npm run test:boundary
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { ESLint } from 'eslint';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Each case is a single import statement that the boundary rule must reject
 * when linted as a virtual file inside src/domain/.
 */
const CASES: Array<{ label: string; code: string }> = [
  {
    label: 'cloudflare:*',
    code: `import type { Env } from 'cloudflare:workers';\n`,
  },
  {
    label: '@cloudflare/*',
    code: `import type { Foo } from '@cloudflare/workers-types';\n`,
  },
  {
    label: '../adapters/*',
    code: `import { bar } from '../adapters/bar';\n`,
  },
  {
    label: './adapters/*',
    code: `import { baz } from './adapters/baz';\n`,
  },
];

async function main(): Promise<void> {
  const eslint = new ESLint({
    cwd: projectRoot,
    // Disable TypeScript project resolution for the programmatic check.
    // `no-restricted-imports` is a syntactic rule — it needs no type info.
    // Without this, lintText with a virtual filepath would fail because
    // @typescript-eslint/parser cannot locate the file in tsconfig.
    overrideConfig: {
      parserOptions: { project: null },
    },
  });

  const virtualPath = path.join(projectRoot, 'src', 'domain', '_boundary-check.ts');

  const failures: string[] = [];

  for (const { label, code } of CASES) {
    const [result] = await eslint.lintText(code, { filePath: virtualPath });
    const violations = result.messages.filter(
      (m) => m.ruleId === 'no-restricted-imports',
    );

    if (violations.length === 0) {
      failures.push(
        `  [FAIL] pattern "${label}" was NOT flagged — check .eslintrc.cjs overrides`,
      );
    }
  }

  if (failures.length > 0) {
    process.stderr.write(
      'FAIL: one or more boundary patterns are not enforced:\n' +
        failures.join('\n') +
        '\n',
    );
    process.exit(1);
  }

  process.stdout.write(
    `PASS: all ${CASES.length} boundary patterns flagged correctly.\n`,
  );
}

main().catch((err: unknown) => {
  process.stderr.write(String(err) + '\n');
  process.exit(1);
});
