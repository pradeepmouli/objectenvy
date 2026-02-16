const assert = require('node:assert');
const vscode = require('vscode');

suite('ObjectEnvy Tools', () => {
  test('Registers commands', async () => {
    const extension = vscode.extensions.getExtension('objectenvy.objectenvy-vscode');
    assert.ok(extension, 'Expected ObjectEnvy extension to be installed in test host');
    await extension.activate();

    const commands = await vscode.commands.getCommands(true);

    assert.ok(
      commands.includes('objectenvy.generateEnv'),
      'Expected command objectenvy.generateEnv to be registered'
    );

    assert.ok(
      commands.includes('objectenvy.generateTypes'),
      'Expected command objectenvy.generateTypes to be registered'
    );

    assert.ok(
      commands.includes('objectenvy.quickConvert'),
      'Expected command objectenvy.quickConvert to be registered'
    );
  });
});
