---
name: vscode-extension-dev
description: Use when building VS Code extensions, creating commands, webviews, language features, or publishing to the marketplace
user-invocable: true
---

# VS Code Extension Development

This skill covers building VS Code extensions with TypeScript, including commands, webviews, language features, testing, and publishing.

## Project Setup

### Scaffold New Extension

```bash
# Using Yeoman generator (recommended)
npx --package yo --package generator-code -- yo code

# Select options:
# - TypeScript
# - esbuild (faster) or webpack
# - Git repository: yes
# - Package manager: pnpm/npm
```

### Project Structure

```
my-extension/
├── .vscode/
│   ├── launch.json          # Debug configurations
│   ├── tasks.json            # Build tasks
│   └── settings.json         # Workspace settings
├── src/
│   ├── extension.ts          # Entry point (activate/deactivate)
│   ├── commands/             # Command implementations
│   ├── providers/            # Language/tree/webview providers
│   ├── webview/              # Webview HTML/CSS/JS
│   └── test/                 # Test files
├── package.json              # Extension manifest
├── tsconfig.json             # TypeScript config
├── esbuild.js                # Build configuration
└── README.md                 # Marketplace description
```

### package.json Manifest

```json
{
  "name": "my-extension",
  "displayName": "My Extension",
  "description": "What it does",
  "version": "0.0.1",
  "publisher": "your-publisher-id",
  "engines": {
    "vscode": "^1.105.0"
  },
  "categories": ["Other"],
  "activationEvents": [],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [],
    "menus": {},
    "configuration": {},
    "views": {},
    "viewsContainers": {}
  },
  "scripts": {
    "vscode:prepublish": "pnpm run build",
    "build": "esbuild ./src/extension.ts --bundle --outfile=dist/extension.js --external:vscode --format=cjs --platform=node",
    "watch": "pnpm run build --watch",
    "test": "vscode-test"
  },
  "devDependencies": {
    "@types/vscode": "^1.105.0",
    "@types/node": "^22.0.0",
    "@vscode/test-cli": "^0.0.10",
    "@vscode/test-electron": "^2.4.1",
    "esbuild": "^0.24.0",
    "typescript": "^5.7.0"
  }
}
```

## Core Concepts

### Extension Entry Point

```typescript
// src/extension.ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension activated');

    // Register commands
    const disposable = vscode.commands.registerCommand(
        'myExtension.helloWorld',
        () => {
            vscode.window.showInformationMessage('Hello World!');
        }
    );

    context.subscriptions.push(disposable);
}

export function deactivate() {
    // Cleanup when extension is deactivated
}
```

### Activation Events

Control when your extension activates in `package.json`:

```json
{
  "activationEvents": [
    "onCommand:myExtension.helloWorld",
    "onLanguage:javascript",
    "onView:myTreeView",
    "workspaceContains:**/.myconfig",
    "onStartupFinished"
  ]
}
```

**Best Practice:** Use implicit activation (empty array) when possible - VS Code automatically activates based on contribution points.

## Commands

### Register Commands

```typescript
// src/commands/myCommand.ts
import * as vscode from 'vscode';

export function registerMyCommand(context: vscode.ExtensionContext) {
    const command = vscode.commands.registerCommand(
        'myExtension.myCommand',
        async (uri?: vscode.Uri) => {
            // Get active editor
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor');
                return;
            }

            // Get selection or full document
            const selection = editor.selection;
            const text = editor.document.getText(selection.isEmpty ? undefined : selection);

            // Do something with text
            await vscode.env.clipboard.writeText(text);
            vscode.window.showInformationMessage('Copied to clipboard!');
        }
    );

    context.subscriptions.push(command);
}
```

### Contribute Commands to UI

```json
{
  "contributes": {
    "commands": [
      {
        "command": "myExtension.myCommand",
        "title": "My Command",
        "category": "My Extension",
        "icon": "$(copy)"
      }
    ],
    "menus": {
      "editor/context": [
        {
          "command": "myExtension.myCommand",
          "when": "editorTextFocus",
          "group": "1_modification"
        }
      ],
      "commandPalette": [
        {
          "command": "myExtension.myCommand",
          "when": "editorIsOpen"
        }
      ]
    },
    "keybindings": [
      {
        "command": "myExtension.myCommand",
        "key": "ctrl+shift+c",
        "mac": "cmd+shift+c",
        "when": "editorTextFocus"
      }
    ]
  }
}
```

## Webviews

### Create Webview Panel

```typescript
// src/providers/MyWebviewProvider.ts
import * as vscode from 'vscode';

export class MyWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'myExtension.webview';

    constructor(private readonly extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.html = this.getHtml(webviewView.webview);

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showInformationMessage(message.text);
                        break;
                }
            },
            undefined,
            []
        );
    }

    private getHtml(webview: vscode.Webview): string {
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'style.css')
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'main.js')
        );

        // Use nonce for security
        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleUri}" rel="stylesheet">
    <title>My Webview</title>
</head>
<body>
    <h1>Hello from Webview</h1>
    <button id="myButton">Click Me</button>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
```

### Webview UI Toolkit

Use Microsoft's official toolkit for consistent VS Code styling:

```bash
pnpm add @vscode/webview-ui-toolkit
```

```html
<!-- In webview HTML -->
<script type="module" src="${toolkitUri}"></script>
<vscode-button>Click Me</vscode-button>
<vscode-text-field placeholder="Enter text"></vscode-text-field>
<vscode-dropdown>
    <vscode-option>Option 1</vscode-option>
    <vscode-option>Option 2</vscode-option>
</vscode-dropdown>
```

## Tree Views

### Tree Data Provider

```typescript
// src/providers/MyTreeProvider.ts
import * as vscode from 'vscode';

export class MyTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly children?: MyTreeItem[]
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}`;
        this.iconPath = new vscode.ThemeIcon('file');
    }
}

export class MyTreeProvider implements vscode.TreeDataProvider<MyTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<MyTreeItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private data: MyTreeItem[] = [];

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: MyTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: MyTreeItem): Thenable<MyTreeItem[]> {
        if (element) {
            return Promise.resolve(element.children || []);
        }
        return Promise.resolve(this.data);
    }

    setData(items: MyTreeItem[]): void {
        this.data = items;
        this.refresh();
    }
}
```

### Contribute Tree View

```json
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "myExtension",
          "title": "My Extension",
          "icon": "resources/icon.svg"
        }
      ]
    },
    "views": {
      "myExtension": [
        {
          "id": "myTreeView",
          "name": "My Tree View",
          "contextualTitle": "My Extension"
        }
      ]
    }
  }
}
```

## Configuration

### Define Settings

```json
{
  "contributes": {
    "configuration": {
      "title": "My Extension",
      "properties": {
        "myExtension.enableFeature": {
          "type": "boolean",
          "default": true,
          "description": "Enable the feature"
        },
        "myExtension.maxItems": {
          "type": "number",
          "default": 10,
          "minimum": 1,
          "maximum": 100,
          "description": "Maximum number of items"
        },
        "myExtension.theme": {
          "type": "string",
          "default": "auto",
          "enum": ["auto", "light", "dark"],
          "enumDescriptions": [
            "Follow VS Code theme",
            "Always use light theme",
            "Always use dark theme"
          ]
        }
      }
    }
  }
}
```

### Read Configuration

```typescript
function getConfig<T>(key: string, defaultValue: T): T {
    const config = vscode.workspace.getConfiguration('myExtension');
    return config.get<T>(key, defaultValue);
}

// Usage
const maxItems = getConfig('maxItems', 10);
const enableFeature = getConfig('enableFeature', true);

// Watch for changes
vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('myExtension.maxItems')) {
        // Handle config change
    }
});
```

## Language Features

### Code Completion Provider

```typescript
import * as vscode from 'vscode';

export class MyCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.CompletionItem[] {
        const linePrefix = document.lineAt(position).text.slice(0, position.character);

        if (!linePrefix.endsWith('my.')) {
            return [];
        }

        const completions: vscode.CompletionItem[] = [];

        const item = new vscode.CompletionItem('myMethod', vscode.CompletionItemKind.Method);
        item.detail = 'My method description';
        item.documentation = new vscode.MarkdownString('Full documentation here');
        item.insertText = new vscode.SnippetString('myMethod(${1:arg})');
        completions.push(item);

        return completions;
    }
}

// Register in extension.ts
context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
        { language: 'typescript', scheme: 'file' },
        new MyCompletionProvider(),
        '.'  // Trigger character
    )
);
```

### Hover Provider

```typescript
export class MyHoverProvider implements vscode.HoverProvider {
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);

        if (word === 'myKeyword') {
            return new vscode.Hover([
                '**My Keyword**',
                new vscode.MarkdownString('Description of what this keyword does.')
            ]);
        }

        return null;
    }
}
```

### Diagnostics

```typescript
const diagnosticCollection = vscode.languages.createDiagnosticCollection('myExtension');

function updateDiagnostics(document: vscode.TextDocument): void {
    const diagnostics: vscode.Diagnostic[] = [];

    const text = document.getText();
    const regex = /TODO:/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + match[0].length);

        const diagnostic = new vscode.Diagnostic(
            new vscode.Range(startPos, endPos),
            'TODO found',
            vscode.DiagnosticSeverity.Warning
        );
        diagnostic.code = 'todo-found';
        diagnostic.source = 'My Extension';
        diagnostics.push(diagnostic);
    }

    diagnosticCollection.set(document.uri, diagnostics);
}

// Register document change listener
vscode.workspace.onDidChangeTextDocument(event => {
    updateDiagnostics(event.document);
});
```

## Testing

### Test Setup

```typescript
// src/test/extension.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Starting tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('publisher.my-extension'));
    });

    test('Should activate', async () => {
        const ext = vscode.extensions.getExtension('publisher.my-extension');
        await ext?.activate();
        assert.ok(ext?.isActive);
    });

    test('Command should work', async () => {
        await vscode.commands.executeCommand('myExtension.helloWorld');
        // Add assertions
    });
});
```

### Run Tests

```bash
# Run tests in VS Code environment
pnpm run test

# Or use @vscode/test-cli
npx @vscode/test-cli
```

## Building & Bundling

### esbuild Configuration

```javascript
// esbuild.js
const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function main() {
    const ctx = await esbuild.context({
        entryPoints: ['src/extension.ts'],
        bundle: true,
        format: 'cjs',
        minify: production,
        sourcemap: !production,
        sourcesContent: false,
        platform: 'node',
        outfile: 'dist/extension.js',
        external: ['vscode'],
        logLevel: 'warning',
        plugins: [
            /* your plugins */
        ],
    });

    if (watch) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
```

### Build Scripts

```json
{
  "scripts": {
    "build": "node esbuild.js",
    "watch": "node esbuild.js --watch",
    "build:prod": "node esbuild.js --production",
    "vscode:prepublish": "pnpm run build:prod",
    "package": "vsce package",
    "publish": "vsce publish"
  }
}
```

## Publishing

### Prepare for Publishing

1. Create publisher at https://marketplace.visualstudio.com/manage
2. Get Personal Access Token from Azure DevOps
3. Install vsce: `pnpm add -D @vscode/vsce`

### Package & Publish

```bash
# Login (first time)
vsce login your-publisher-id

# Package locally
vsce package

# Publish to marketplace
vsce publish

# Publish with version bump
vsce publish minor  # or major, patch
```

### .vscodeignore

```
.vscode/**
.vscode-test/**
src/**
node_modules/**
.gitignore
*.map
*.ts
tsconfig.json
esbuild.js
```

## Best Practices

### Performance

- **Lazy activation**: Don't activate on `*`, use specific events
- **Dispose resources**: Always dispose subscriptions, watchers, providers
- **Debounce**: Debounce frequent operations (typing, file watching)
- **Web workers**: Use for CPU-intensive tasks

```typescript
// Debounce example
function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

const debouncedUpdate = debounce(updateDiagnostics, 500);
```

### Security

- **CSP**: Always use Content Security Policy in webviews
- **Nonces**: Use nonces for inline scripts
- **Sanitize**: Sanitize user input before displaying
- **No eval**: Never use eval() or Function()

### UX Guidelines

- **Progress**: Show progress for long operations
- **Cancellation**: Support cancellation tokens
- **Error handling**: Show user-friendly error messages
- **Telemetry**: Respect user privacy settings

```typescript
// Progress example
await vscode.window.withProgress(
    {
        location: vscode.ProgressLocation.Notification,
        title: 'Processing...',
        cancellable: true
    },
    async (progress, token) => {
        for (let i = 0; i < 100; i++) {
            if (token.isCancellationRequested) {
                return;
            }
            progress.report({ increment: 1, message: `Step ${i}` });
            await delay(100);
        }
    }
);
```

## Debugging

### Launch Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "preLaunchTask": "npm: watch"
    },
    {
      "name": "Extension Tests",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}",
        "--extensionTestsPath=${workspaceFolder}/dist/test/suite/index"
      ],
      "outFiles": ["${workspaceFolder}/dist/test/**/*.js"],
      "preLaunchTask": "npm: watch"
    }
  ]
}
```

### Debug Tips

- Press F5 to launch Extension Development Host
- Set breakpoints in TypeScript source files
- Use Debug Console for runtime inspection
- Check Output panel > "Extension Host" for logs
- Use `vscode.window.createOutputChannel()` for extension logs

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Contribution Points Reference](https://code.visualstudio.com/api/references/contribution-points)
- [VS Code API Reference](https://code.visualstudio.com/api/references/vscode-api)
- [Webview API Guide](https://code.visualstudio.com/api/extension-guides/webview)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Webview UI Toolkit](https://github.com/microsoft/vscode-webview-ui-toolkit)
- [Extension Samples](https://github.com/microsoft/vscode-extension-samples)
