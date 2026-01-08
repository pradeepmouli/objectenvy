# Contract — objectenvy-vscode Extension

## Activation

- Activation events remain identical to `vscode-envyconfig`
- Extension activates on the same file patterns and commands

## Commands

- All commands are registered with updated IDs/namespacing reflecting `objectenvy`
- Command behavior remains identical (inputs, side effects, output)

## API Usage

- Uses VS Code API ≥1.85.0 as in current project
- No breaking changes in user-facing behavior; identifiers updated only

## Error Semantics

- Error handling and messages preserved; wording may reflect new naming
