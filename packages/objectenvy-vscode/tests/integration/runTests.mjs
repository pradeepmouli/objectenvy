import { runTests } from '@vscode/test-electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const extensionDevelopmentPath = path.resolve(__dirname, '../..');
  const extensionTestsPath = path.resolve(__dirname, './suite/index.js');

  try {
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [path.resolve(extensionDevelopmentPath, '../..')]
    });
  } catch (error) {
    console.error('Failed to run integration tests');
    console.error(error);
    process.exit(1);
  }
}

await main();
