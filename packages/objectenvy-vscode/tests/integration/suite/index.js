import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const _suites = [];
let _current = null;

globalThis.suite = (name, fn) => {
  const s = { name, tests: [] };
  _suites.push(s);
  _current = s;
  fn();
  _current = null;
};

globalThis.test = (name, fn) => {
  (_current ?? { tests: _suites }).tests.push({ name, fn });
};

export async function run() {
  const files = readdirSync(__dirname).filter(f => f.endsWith('.test.js'));
  for (const file of files) {
    await import(path.join(__dirname, file));
  }

  let failures = 0;
  for (const s of _suites) {
    console.log(`\n  ${s.name}`);
    for (const { name, fn } of s.tests) {
      try {
        await fn();
        console.log(`    ✓ ${name}`);
      } catch (err) {
        console.error(`    ✗ ${name}`);
        console.error(err);
        failures++;
      }
    }
  }

  if (failures > 0) {
    throw new Error(`${failures} test(s) failed.`);
  }
}
