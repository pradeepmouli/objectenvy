/**
 * ObjectEnvy Tools VS Code Extension
 * @module extension
 */

import * as vscode from 'vscode';
import { objectify, envy } from 'objectenvy';
import type { ConfigValue, ConfigObject } from 'objectenvy';
import type {
import {
  Project,
  SyntaxKind,
  InterfaceDeclaration,
  TypeAliasDeclaration,
  TypeNode
} from 'ts-morph';

/**
 * Type guard to check if a value is a ConfigValue.
 * This recursively validates arrays and nested objects.
 */
function isConfigValue(value: unknown): value is ConfigValue {
  const type = typeof value;

  // Primitive enviable values
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return true;
  }

  // Arrays must contain only ConfigValue elements
  if (Array.isArray(value)) {
    return value.every(element => isConfigValue(element));
  }

  // Plain objects (non-null, non-array) whose values are ConfigValue
  if (type === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    return Object.values(obj).every(v => isConfigValue(v));
  }

  // All other types (undefined, function, symbol, bigint, etc.) are invalid
  return false;
}

/**
 * Type guard to check if value is a ConfigObject (EnviableObject)
 * Validates that the value is a plain object (not array or null)
 * and that all nested values conform to ConfigValue.
 */
function isConfigObject(value: unknown): value is ConfigObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return Object.values(obj).every(v => isConfigValue(v));
}

/**
 * Type guard to validate parsed intermediate object
 */
function assertConfigObject(value: unknown): asserts value is ConfigObject {
  if (!isConfigObject(value)) {
    throw new Error('Parsed value is not a valid ConfigObject');
  }
}

/**
 * Extension activation entry point
 */
export function activate(context: vscode.ExtensionContext): void {
  const outputChannel = vscode.window.createOutputChannel('ObjectEnvy Tools');

  outputChannel.appendLine('ObjectEnvy Tools extension activated');
  outputChannel.appendLine(`Version: 1.1.0`);
  outputChannel.appendLine('Using ObjectEnvy library for conversions');

  // Register commands
  const generateEnvCommand = vscode.commands.registerCommand(
    'objectenvy.generateEnv',
    async () => {
      try {
        await handleGenerateEnv(outputChannel);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Generate .env failed: ${message}`);
        outputChannel.appendLine(`Error: ${message}`);
      }
    }
  );

  const generateTypesCommand = vscode.commands.registerCommand(
    'objectenvy.generateTypes',
    async () => {
      try {
        await handleGenerateTypes(outputChannel);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Generate Types failed: ${message}`);
        outputChannel.appendLine(`Error: ${message}`);
      }
    }
  );

  const quickConvertCommand = vscode.commands.registerCommand(
    'objectenvy.quickConvert',
    async () => {
      try {
        await handleQuickConvert(context, outputChannel);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Quick Convert failed: ${message}`);
        outputChannel.appendLine(`Error: ${message}`);
      }
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
 * Handle Generate .env from Schema command
 */
async function handleGenerateEnv(outputChannel: vscode.OutputChannel): Promise<void> {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showWarningMessage('No active editor. Please open a schema file first.');
    return;
  }

  const document = editor.document;
  const ext = document.fileName.split('.').pop()?.toLowerCase();

  if (!ext || !['ts', 'json', 'js', 'tsx', 'jsx'].includes(ext)) {
    vscode.window.showWarningMessage('Please open a TypeScript or JSON schema file.');
    return;
  }

  try {
    outputChannel.appendLine(`Generating .env from: ${document.fileName}`);

    const content = document.getText();
    let intermediateObj: unknown;

    // Parse based on file extension
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
      intermediateObj = parseTypeScriptToObject(content);
    } else if (ext === 'json') {
      intermediateObj = JSON.parse(content);
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    // Validate the parsed object
    assertConfigObject(intermediateObj);

    // Convert to .env format
    const envVars = envy(intermediateObj);
    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create new .env file
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showWarningMessage('No workspace folder open');
      return;
    }

    const envUri = vscode.Uri.joinPath(workspaceFolder.uri, '.env.template');
    const encoder = new TextEncoder();
    await vscode.workspace.fs.writeFile(envUri, encoder.encode(envContent));

    const envDoc = await vscode.workspace.openTextDocument(envUri);
    await vscode.window.showTextDocument(envDoc, { viewColumn: vscode.ViewColumn.Beside });

    outputChannel.appendLine(`Generated .env.template with ${Object.keys(envVars).length} variables`);
    vscode.window.showInformationMessage('Generated .env.template successfully!');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel.appendLine(`Error: ${message}`);
    throw error;
  }
}

/**
 * Handle Generate Types from .env command
 */
async function handleGenerateTypes(outputChannel: vscode.OutputChannel): Promise<void> {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showWarningMessage('No active editor. Please open a .env file first.');
    return;
  }

  const document = editor.document;
  const fileName = document.fileName.split('/').pop()?.toLowerCase();

  if (!fileName?.includes('.env')) {
    vscode.window.showWarningMessage('Please open a .env file.');
    return;
  }

  try {
    outputChannel.appendLine(`Generating types from: ${document.fileName}`);

    const content = document.getText();

    // Parse .env content
    const env: Record<string, string> = {};
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const equalsIndex = trimmed.indexOf('=');
      if (equalsIndex === -1) continue;
      const key = trimmed.substring(0, equalsIndex).trim();
      const value = trimmed.substring(equalsIndex + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = value;
    }

    // Convert to nested object
    const configObj = objectify({ env, coerce: true });

    // Generate TypeScript interface
    const interfaceName = await vscode.window.showInputBox({
      prompt: 'Enter interface name',
      value: 'Config',
      placeHolder: 'Config'
    });

    if (!interfaceName) {
      return; // User cancelled
    }

    const tsContent = convertObjectToTypeScript(configObj, interfaceName);

    // Create new .ts file
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showWarningMessage('No workspace folder open');
      return;
    }

    const tsUri = vscode.Uri.joinPath(workspaceFolder.uri, `${interfaceName.toLowerCase()}.types.ts`);
    const encoder = new TextEncoder();
    await vscode.workspace.fs.writeFile(tsUri, encoder.encode(tsContent));

    const tsDoc = await vscode.workspace.openTextDocument(tsUri);
    await vscode.window.showTextDocument(tsDoc, { viewColumn: vscode.ViewColumn.Beside });

    outputChannel.appendLine(`Generated TypeScript interface: ${interfaceName}`);
    vscode.window.showInformationMessage(`Generated ${interfaceName} interface successfully!`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel.appendLine(`Error: ${message}`);
    throw error;
  }
}

/**
 * Handle Quick Convert command with WebView panel
 */
async function handleQuickConvert(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel
): Promise<void> {
  const panel = vscode.window.createWebviewPanel(
    'objectenvyQuickConvert',
    'ObjectEnvy Quick Convert',
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );

  panel.webview.html = getQuickConvertHtml();

  outputChannel.appendLine('Quick Convert panel opened');

  // Handle messages from the webview
  panel.webview.onDidReceiveMessage(
    async (message) => {
      switch (message.command) {
        case 'convert':
          await handleConvertRequest(panel, message, outputChannel);
          break;
        case 'copyToClipboard':
          await vscode.env.clipboard.writeText(message.text);
          vscode.window.showInformationMessage('Copied to clipboard!');
          break;
        case 'createFile':
          await handleCreateFile(message.content, message.filename);
          break;
      }
    },
    undefined,
    context.subscriptions
  );
}

/**
 * Handle conversion request from webview
 */
async function handleConvertRequest(
  panel: vscode.WebviewPanel,
  message: { input: string; from: string; to: string },
  outputChannel: vscode.OutputChannel
): Promise<void> {
  try {
    outputChannel.appendLine(`Converting from ${message.from} to ${message.to}`);

    let output = '';

    // Parse input based on source format
    let intermediateObj: unknown;

    if (message.from === 'typescript') {
      intermediateObj = parseTypeScriptToObject(message.input);
    } else if (message.from === 'json') {
      intermediateObj = JSON.parse(message.input);
    } else if (message.from === 'env') {
      // Parse env to object first
      const env: Record<string, string> = {};
      const lines = message.input.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const equalsIndex = trimmed.indexOf('=');
        if (equalsIndex === -1) continue;
        const key = trimmed.substring(0, equalsIndex).trim();
        const value = trimmed.substring(equalsIndex + 1).trim().replace(/^["']|["']$/g, '');
        env[key] = value;
      }
      intermediateObj = objectify({ env, coerce: true });
    } else {
      throw new Error(`Unsupported input format: ${message.from}`);
    }

    // Validate the parsed object
    assertConfigObject(intermediateObj);

    // Convert to output format
    if (message.to === 'env') {
      const envVars = envy(intermediateObj);
      output = Object.entries(envVars)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    } else if (message.to === 'json') {
      output = JSON.stringify(intermediateObj, null, 2);
    } else if (message.to === 'typescript') {
      output = convertObjectToTypeScript(intermediateObj);
    } else {
      throw new Error(`Unsupported output format: ${message.to}`);
    }

    panel.webview.postMessage({
      command: 'conversionResult',
      output: output
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    panel.webview.postMessage({
      command: 'conversionError',
      error: errorMessage
    });
  }
}

/**
 * Parse TypeScript interface/type to object
 */
function parseTypeScriptToObject(input: string): ConfigObject {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile('temp.ts', input);

  // Find first interface or type alias
  const interfaces = sourceFile.getInterfaces();
  const typeAliases = sourceFile.getTypeAliases();

  if (interfaces.length > 0) {
    return extractFieldsFromInterface(interfaces[0]!);
  } else if (typeAliases.length > 0) {
    return extractFieldsFromTypeAlias(typeAliases[0]!);
  }

  throw new Error('No interface or type found in input');
}

/**
 * Extract fields from interface declaration
 */
function extractFieldsFromInterface(
  iface: InterfaceDeclaration
): Record<string, any> {
  const obj: Record<string, any> = {};

  for (const prop of iface.getProperties()) {
    const name = prop.getName();
    const typeNode = prop.getTypeNode();

    if (!typeNode) continue;

    obj[name] = inferDefaultValue(typeNode);
  }

  return obj;
}

/**
 * Extract fields from type alias
 */
function extractFieldsFromTypeAlias(typeAlias: TypeAliasDeclaration): ConfigObject {
  const typeNode = typeAlias.getTypeNode();

  if (!typeNode) {
    throw new Error('Type alias has no type node');
  }

  if (typeNode.getKind() === SyntaxKind.TypeLiteral) {
    const obj: ConfigObject = {};
    const typeLiteral = typeNode.asKindOrThrow(SyntaxKind.TypeLiteral);

    for (const member of typeLiteral.getProperties()) {
      if (member.getKind() === SyntaxKind.PropertySignature) {
        const name = member.getName();
        const propTypeNode = member.getTypeNode();

        if (propTypeNode) {
          obj[name] = inferDefaultValue(propTypeNode);
        }
      }
    }

    return obj;
  }

  throw new Error('Type alias must be an object type');
}

/**
 * Infer a default value from a TypeScript type node
 */
function inferDefaultValue(typeNode: TypeNode): ConfigValue {
  const typeText = typeNode.getText();

  // String type
  if (typeText === 'string' || typeNode.getKind() === SyntaxKind.StringKeyword) {
    return '';
  }

  // Number type
  if (typeText === 'number' || typeNode.getKind() === SyntaxKind.NumberKeyword) {
    return 0;
  }

  // Boolean type
  if (typeText === 'boolean' || typeNode.getKind() === SyntaxKind.BooleanKeyword) {
    return false;
  }

  // Array type
  if (typeNode.getKind() === SyntaxKind.ArrayType || typeText.endsWith('[]')) {
    return [];
  }

  // Object/interface type literal
  if (typeNode.getKind() === SyntaxKind.TypeLiteral) {
    const obj: ConfigObject = {};
    const typeLiteral = typeNode.asKindOrThrow(SyntaxKind.TypeLiteral);

    for (const member of typeLiteral.getProperties()) {
      if (member.getKind() === SyntaxKind.PropertySignature) {
        const name = member.getName();
        const propTypeNode = member.getTypeNode();

        if (propTypeNode) {
          obj[name] = inferDefaultValue(propTypeNode);
        }
      }
    }

    return obj;
  }

  // Default to empty string
  return '';
}

/**
 * Convert object to TypeScript interface
 */
function convertObjectToTypeScript(obj: ConfigObject, interfaceName = 'Config'): string {
  function getTypeString(value: ConfigValue): string {
    if (value === null || value === undefined) return 'unknown';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'unknown[]';
      const firstElement = value[0];
      if (firstElement === null || firstElement === undefined) return 'unknown[]';
      const firstType = getTypeString(firstElement);
      return `${firstType}[]`;
    }
    if (typeof value === 'object' && isConfigObject(value)) {
      return generateNestedInterface(value);
    }
    return 'unknown';
  }

  function generateNestedInterface(obj: ConfigObject, indent = '  '): string {
    const lines = ['{'];
    for (const [key, value] of Object.entries(obj)) {
      const typeStr = getTypeString(value);
      lines.push(`${indent}${key}: ${typeStr};`);
    }
    lines.push('}');
    return lines.join('\n');
  }

  const lines = [`export interface ${interfaceName} {`];
  for (const [key, value] of Object.entries(obj)) {
    const typeStr = getTypeString(value);
    lines.push(`  ${key}: ${typeStr};`);
  }
  lines.push('}');

  return lines.join('\n');
}

/**
 * Handle creating a new file
 */
async function handleCreateFile(content: string, filename: string): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  if (!workspaceFolder) {
    vscode.window.showWarningMessage('No workspace folder open');
    return;
  }

  const uri = vscode.Uri.joinPath(workspaceFolder.uri, filename);
  const encoder = new TextEncoder();
  await vscode.workspace.fs.writeFile(uri, encoder.encode(content));

  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(doc);

  vscode.window.showInformationMessage(`Created: ${filename}`);
}

/**
 * Generate HTML for Quick Convert webview
 */
function getQuickConvertHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ObjectEnvy Quick Convert</title>
  <style>
    body {
      padding: 20px;
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
    }
    .container {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .row {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    textarea {
      width: 100%;
      min-height: 200px;
      padding: 10px;
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      resize: vertical;
    }
    select, button {
      padding: 6px 12px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      cursor: pointer;
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .error {
      color: var(--vscode-errorForeground);
      padding: 10px;
      background: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
    }
    label {
      font-weight: bold;
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Quick Convert</h2>

    <div>
      <label>Input Format:</label>
      <select id="fromFormat">
        <option value="json">JSON</option>
        <option value="env">.env</option>
        <option value="typescript">TypeScript</option>
      </select>
      <label style="margin-left: 20px;">Output Format:</label>
      <select id="toFormat">
        <option value="env">.env</option>
        <option value="json">JSON</option>
        <option value="typescript">TypeScript</option>
      </select>
    </div>

    <div>
      <label>Input:</label>
      <textarea id="input" placeholder="Paste your input here..."></textarea>
    </div>

    <div class="row">
      <button id="convertBtn">Convert</button>
      <button id="copyBtn" style="display:none;">Copy to Clipboard</button>
      <button id="createFileBtn" style="display:none;">Create File</button>
    </div>

    <div id="error" class="error" style="display:none;"></div>

    <div>
      <label>Output:</label>
      <textarea id="output" readonly placeholder="Conversion result will appear here..."></textarea>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const inputElem = document.getElementById('input');
    const outputElem = document.getElementById('output');
    const errorElem = document.getElementById('error');
    const convertBtn = document.getElementById('convertBtn');
    const copyBtn = document.getElementById('copyBtn');
    const createFileBtn = document.getElementById('createFileBtn');
    const fromFormat = document.getElementById('fromFormat');
    const toFormat = document.getElementById('toFormat');

    convertBtn.addEventListener('click', () => {
      errorElem.style.display = 'none';
      outputElem.value = 'Converting...';
      copyBtn.style.display = 'none';
      createFileBtn.style.display = 'none';

      vscode.postMessage({
        command: 'convert',
        input: inputElem.value,
        from: fromFormat.value,
        to: toFormat.value
      });
    });

    copyBtn.addEventListener('click', () => {
      vscode.postMessage({
        command: 'copyToClipboard',
        text: outputElem.value
      });
    });

    createFileBtn.addEventListener('click', () => {
      const ext = toFormat.value === 'env' ? '.env' : toFormat.value === 'json' ? '.json' : '.ts';
      const filename = 'converted' + ext;
      vscode.postMessage({
        command: 'createFile',
        content: outputElem.value,
        filename: filename
      });
    });

    window.addEventListener('message', event => {
      const message = event.data;

      if (message.command === 'conversionResult') {
        outputElem.value = message.output;
        copyBtn.style.display = 'inline-block';
        createFileBtn.style.display = 'inline-block';
      } else if (message.command === 'conversionError') {
        errorElem.textContent = 'Error: ' + message.error;
        errorElem.style.display = 'block';
        outputElem.value = '';
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Extension deactivation cleanup
 */
export function deactivate(): void {
  // Cleanup will be added as needed
}
