# API Contract: VS Code Extension

**Extension**: vscode-envyconfig  
**Purpose**: VS Code integration for CLI tools  
**Version**: 1.0.0

## Extension Overview

Provides VS Code integration for env-y-config and config-y-env CLI tools with WebView previews, command palette commands, and context menu integration.

## Activation

**Activation Events**:
- `onCommand:envyconfig.*` - When any extension command is invoked
- `onLanguage:typescript` - When TypeScript file is opened
- `onLanguage:json` - When JSON file is opened
- `workspaceContains:.env` - When .env file exists in workspace

**Startup Time**: <100ms overhead

## Commands

### Command: `envyconfig.generateEnv`

**Title**: "EnvyConfig: Generate .env from Schema"

**Description**: Generate .env file from schema definition

**Activation**:
- Command palette
- Context menu on schema files (`.ts`, `.json`)

**Workflow**:
1. Show file picker (if not invoked from context menu)
2. Detect input format or show format selection
3. For TypeScript interfaces: Show export picker
4. Show options panel (prefix, comments, required-only)
5. Execute env-y-config CLI
6. Display preview in WebView panel
7. User actions: Create file / Copy to clipboard

**Options**:
```typescript
interface GenerateEnvOptions {
  inputFile: string;
  format?: InputFormat;
  exportName?: string;
  prefix?: string;
  includeComments: boolean;
  requiredOnly: boolean;
}
```

### Command: `envyconfig.generateTypes`

**Title**: "EnvyConfig: Generate Types from .env"

**Description**: Generate TypeScript types from .env file

**Activation**:
- Command palette
- Context menu on .env files

**Workflow**:
1. Show file picker (if not invoked from context menu)
2. Show output format selection (TypeScript, JSON Schema, JavaScript, Zod)
3. Show options panel (interface name, inference mode, comments, Zod schema)
4. Execute config-y-env CLI
5. Display preview in WebView panel
6. User actions: Create file / Copy to clipboard

**Options**:
```typescript
interface GenerateTypesOptions {
  inputFile: string;
  outputFormat: OutputFormat;
  interfaceName: string;
  inferenceMode: InferenceMode;
  includeComments: boolean;
  withZodSchema: boolean;
}
```

### Command: `envyconfig.quickConvert`

**Title**: "EnvyConfig: Quick Convert"

**Description**: Auto-detect file type and show appropriate conversion options

**Activation**:
- Command palette
- Keyboard shortcut: `Ctrl+Shift+E` / `Cmd+Shift+E`

**Behavior**:
- If current file is schema (.ts, .json): Show generate .env options
- If current file is .env: Show generate types options
- Otherwise: Show file picker and detect type

### Command: `envyconfig.openSettings`

**Title**: "EnvyConfig: Open Settings"

**Description**: Open extension settings panel

**Activation**:
- Command palette
- Settings button in WebView panel

## Context Menu Integration

### On Schema Files (.ts, .json)

**Context Menu Items**:
- "Generate .env from this Schema" → `envyconfig.generateEnv`

**Condition**: File extension is `.ts` or `.json`

### On .env Files

**Context Menu Items**:
- "Generate Types from this .env" → `envyconfig.generateTypes`

**Condition**: File name matches `.env` or `.env.*`

## WebView Panel

### Panel Title

- "EnvyConfig: Preview" (default)
- "EnvyConfig: .env Preview" (when previewing .env)
- "EnvyConfig: Types Preview" (when previewing types)

### Panel Location

**Default**: Editor column 2 (beside active editor)  
**User Configurable**: Can be moved to any column

### Panel Content

**Layout**:
```
┌──────────────────────────────────────┐
│ [Format Tabs: TS | JSON | Zod]      │
├──────────────────────────────────────┤
│                                      │
│  Monaco Editor                       │
│  (Syntax-highlighted preview)        │
│                                      │
│                                      │
├──────────────────────────────────────┤
│ [Create File] [Copy] [Settings]     │
└──────────────────────────────────────┘
```

**Features**:
- Syntax highlighting (Monaco Editor)
- Line numbers
- Minimap (for large files)
- Read-only (no editing in preview)

### Format Tabs

**For Generate .env**:
- Only .env tab (single format)

**For Generate Types**:
- TypeScript tab
- JSON Schema tab
- JavaScript tab
- Zod tab

**Behavior**: Click tab to switch output format, preview updates automatically

### Action Buttons

#### Create File Button

**Label**: "Create File"

**Behavior**:
1. Show file save dialog
2. Suggest default file name:
   - .env → `.env.sample`
   - TypeScript → `config.types.ts`
   - JSON Schema → `config.schema.json`
   - Zod → `config.schema.ts`
3. Write content to selected file
4. Open file in editor
5. Show success notification

**Error Handling**: Show error notification if write fails

#### Copy Button

**Label**: "Copy to Clipboard"

**Behavior**:
1. Copy preview content to clipboard
2. Show success notification: "Copied to clipboard"

**Error Handling**: Show error notification if copy fails

#### Settings Button

**Label**: "Settings" (gear icon)

**Behavior**:
1. Open options panel overlay
2. Show current options (prefix, comments, inference mode, etc.)
3. Allow modifications
4. "Apply" button: Regenerate preview with new options
5. "Save as Default" button: Save to workspace settings

### Loading State

**Display**: Loading spinner with message  
**Message**: "Generating preview..."  
**Timeout**: 10 seconds (show error after timeout)

### Error State

**Display**: Error icon with message

**Error Types**:
1. **Tool Not Installed**
   ```
   CLI tools not found
   
   Please install:
   npm install -g env-y-config config-y-env
   
   [Install Now] [Dismiss]
   ```

2. **Parse Error**
   ```
   Failed to parse input file
   
   [Error details]
   
   [View CLI Output] [Dismiss]
   ```

3. **Execution Timeout**
   ```
   Conversion timed out (>10s)
   
   Large files may take longer.
   
   [Retry] [Dismiss]
   ```

## Extension Settings

### `envyconfig.prefix`

**Type**: String  
**Default**: `""` (empty)  
**Description**: Default prefix for generated environment variables

**Example**: `"APP"` → All variables prefixed with `APP_`

### `envyconfig.includeComments`

**Type**: Boolean  
**Default**: `true`  
**Description**: Include comments in generated output by default

### `envyconfig.inferenceMode`

**Type**: Enum  
**Values**: `"strict"`, `"loose"`  
**Default**: `"strict"`  
**Description**: Default type inference mode

### `envyconfig.autoPreview`

**Type**: Boolean  
**Default**: `false`  
**Description**: Automatically show preview when opening schema or .env files

**Behavior**: If true, preview panel opens automatically when relevant files are opened

### `envyconfig.cliToolPath`

**Type**: String  
**Default**: `""` (auto-detect in PATH)  
**Description**: Custom path to CLI tools directory

**Example**: `"/usr/local/bin"` or `"/home/user/.npm-global/bin"`

### `envyconfig.previewRefreshDelay`

**Type**: Number  
**Default**: `500` (milliseconds)  
**Description**: Debounce delay for auto-refresh when source file changes

## Output Channel

**Channel Name**: "EnvyConfig Tools"

**Logging Levels**:
- INFO: Command executions, successful operations
- WARN: Non-fatal issues (tool not found, parse warnings)
- ERROR: Fatal errors, exceptions

**Log Format**:
```
[YYYY-MM-DD HH:mm:ss] [LEVEL] Message
```

**Example**:
```
[2026-01-04 10:30:15] [INFO] Executing: env-y-config schema.ts -o -
[2026-01-04 10:30:16] [INFO] Preview generated successfully (250ms)
[2026-01-04 10:30:20] [WARN] CLI tool not found: env-y-config
```

## Notifications

### Success Notifications

- "Preview generated successfully"
- "File created: [path]"
- "Copied to clipboard"

**Display**: Transient (auto-dismiss after 3 seconds)

### Error Notifications

- "Failed to generate preview: [reason]"
- "CLI tools not installed"
- "Cannot write to file: [path]"

**Display**: Persistent (requires manual dismiss)  
**Actions**: Contextual action buttons (Install, Retry, etc.)

## Keyboard Shortcuts

### Default Shortcuts

| Command | Windows/Linux | macOS |
|---------|--------------|-------|
| Quick Convert | `Ctrl+Shift+E` | `Cmd+Shift+E` |
| Generate .env | None (user-configurable) | None |
| Generate Types | None (user-configurable) | None |

**Customization**: Users can modify shortcuts in Keyboard Shortcuts settings

## Status Bar Integration

**Status Bar Item**: None by default

**Optional**: Show status bar item when preview panel is open
- Icon: EnvyConfig logo
- Text: "EnvyConfig: Ready"
- Click: Focus preview panel

## CLI Tool Detection

### Detection Method

1. Check `envyconfig.cliToolPath` setting
2. If not set, search in PATH:
   - Unix: `which env-y-config`
   - Windows: `where env-y-config`
3. Cache result for session (avoid repeated checks)

### Installation Prompt

**Trigger**: When CLI tool not found

**Notification**:
```
EnvyConfig CLI tools not installed

Install now?

[Install with npm] [Install with pnpm] [Install with yarn] [Dismiss]
```

**Actions**:
- Install with npm: Opens integrated terminal and runs `npm install -g env-y-config config-y-env`
- Install with pnpm: Opens terminal with pnpm command
- Install with yarn: Opens terminal with yarn command
- Dismiss: Close notification

### Version Check

**Trigger**: On extension activation (if tools installed)

**Behavior**:
- Execute: `env-y-config --version` and `config-y-env --version`
- Check if version meets minimum requirements (≥1.0.0)
- If outdated: Show update notification

## Performance Targets

| Metric | Target |
|--------|--------|
| Extension Activation | <100ms |
| Preview Rendering | <500ms |
| File Generation | <200ms |
| CLI Tool Execution | <1000ms |
| WebView Update | <100ms |

## Error Recovery

### Automatic Retry

**Conditions**:
- Network timeout (if CLI tools download dependencies)
- Temporary file access issues

**Behavior**: Retry up to 3 times with exponential backoff (1s, 2s, 4s)

### Manual Recovery

**User Actions**:
- "Retry" button in error states
- "Reload Extension" command (restarts extension host)
- "Clear Cache" command (resets cached CLI tool detection)

## Telemetry

**Collected Data** (if telemetry enabled):
- Command usage frequency
- Average execution times
- Error rates by type
- Output format preferences

**Privacy**: No personal data or file contents collected

**Opt-out**: Respects VS Code telemetry settings

## Extension Dependencies

**Required**:
- `vscode` API version 1.85.0+

**Optional** (bundled):
- Monaco Editor (for syntax highlighting in WebView)

**External** (not bundled):
- env-y-config CLI tool
- config-y-env CLI tool

## Compatibility

**VS Code Version**: 1.85.0 or later  
**Operating Systems**: Linux, macOS, Windows  
**Node.js**: 20.0.0 or later (for CLI tools)

## Extension Size

**Target**: <2MB bundled extension  
**Typical**: ~1.5MB after minification and compression

---

*Contract version: 1.0.0*
