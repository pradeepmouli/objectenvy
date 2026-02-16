const fs = require('node:fs');
const path = require('node:path');
const Mocha = require('mocha');

function findTestFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...findTestFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.test.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

function run() {
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
  });

  const testsRoot = __dirname;
  const testFiles = findTestFiles(testsRoot);

  for (const filePath of testFiles) {
    mocha.addFile(filePath);
  }

  return new Promise((resolve, reject) => {
    try {
      mocha.run((failures) => {
        if (failures > 0) {
          reject(new Error(`${failures} test(s) failed.`));
          return;
        }
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { run };
