/**
 * Hexagonal boundary guard.
 *
 * Regression coverage for the `no-restricted-imports` ESLint rule in
 * .eslintrc.cjs. Verifies that the rule is correctly wired to block
 * forbidden imports from src/domain/.
 *
 * This is NOT a red-green-refactor TDD cycle — the rule was added in
 * task 0.1. This script provides automated regression coverage so that
 * removing or misconfiguring the rule causes `npm run verify` to fail.
 *
 * Run standalone: npm run test:boundary
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { ESLint } from 'eslint';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// A minimal import statement that the domain boundary rule must reject.
// We lint this as a virtual file inside src/domain/ so the override applies.
const FORBIDDEN_IMPORT = `import type { Env } from 'cloudflare:workers';\n`;

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

  const [result] = await eslint.lintText(FORBIDDEN_IMPORT, {
    // Virtual filepath in src/domain/ activates the domain override rules.
    filePath: path.join(projectRoot, 'src', 'domain', '_boundary-check.ts'),
  });

  const violations = result.messages.filter(
    (m) => m.ruleId === 'no-restricted-imports',
  );

  if (violations.length === 0) {
    process.stderr.write(
      'FAIL: no-restricted-imports did not flag a cloudflare:* import ' +
        'from src/domain/.\n' +
        'The boundary rule in .eslintrc.cjs may be missing or misconfigured.\n',
    );
    process.exit(1);
  }

  process.stdout.write(
    `PASS: hexagonal boundary rule flagged ${violations.length} violation(s) correctly.\n`,
  );
}

main().catch((err: unknown) => {
  process.stderr.write(String(err) + '\n');
  process.exit(1);
});
