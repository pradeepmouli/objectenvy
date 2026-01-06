/**
 * EnvyConfig Tools VS Code Extension
 * @module extension
 */

import * as vscode from 'vscode';

/**
 * Extension activation entry point
 */
export function activate(context: vscode.ExtensionContext): void {
  const outputChannel = vscode.window.createOutputChannel('EnvyConfig Tools');

  outputChannel.appendLine('EnvyConfig Tools extension activated');
  outputChannel.appendLine(`Version: 1.0.0`);

  // Register commands (implementation will be added in Phase 5)
  const generateEnvCommand = vscode.commands.registerCommand(
    'envyconfig.generateEnv',
    () => {
      vscode.window.showInformationMessage('Generate .env from Schema - Implementation pending');
    }
  );

  const generateTypesCommand = vscode.commands.registerCommand(
    'envyconfig.generateTypes',
    () => {
      vscode.window.showInformationMessage('Generate Types from .env - Implementation pending');
    }
  );

  const quickConvertCommand = vscode.commands.registerCommand(
    'envyconfig.quickConvert',
    () => {
      vscode.window.showInformationMessage('Quick Convert - Implementation pending');
    }
  );

  context.subscriptions.push(
    generateEnvCommand,
    generateTypesCommand,
    quickConvertCommand,
    outputChannel
  );
}

/**
 * Extension deactivation cleanup
 */
export function deactivate(): void {
  // Cleanup will be added as needed
}
