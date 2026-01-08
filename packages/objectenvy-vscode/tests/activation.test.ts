/**
 * VS Code extension activation tests
 * Tests that the extension activates and registers commands correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock VS Code API
vi.mock('vscode', () => {
  return {
    commands: {
      registerCommand: vi.fn((id, callback) => ({
        dispose: vi.fn(),
        _id: id,
        _callback: callback
      }))
    },
    window: {
      createOutputChannel: vi.fn(() => ({
        appendLine: vi.fn(),
        dispose: vi.fn()
      })),
      showInformationMessage: vi.fn()
    },
    ExtensionContext: vi.fn()
  };
});

describe('VS Code extension activation', () => {
  let vscode: any;
  let extension: any;

  beforeEach(async () => {
    vscode = await import('vscode');
    extension = await import('../src/extension.js');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should activate without errors', () => {
    const mockContext = {
      subscriptions: []
    };

    expect(() => {
      extension.activate(mockContext);
    }).not.toThrow();
  });

  it('should create output channel', () => {
    const mockContext = {
      subscriptions: []
    };

    extension.activate(mockContext);

    expect(vscode.window.createOutputChannel).toHaveBeenCalledWith('ObjectEnvy Tools');
  });

  it('should register generate env command', () => {
    const mockContext = {
      subscriptions: []
    };

    extension.activate(mockContext);

    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'objectenvy.generateEnv',
      expect.any(Function)
    );
  });

  it('should register generate types command', () => {
    const mockContext = {
      subscriptions: []
    };

    extension.activate(mockContext);

    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'objectenvy.generateTypes',
      expect.any(Function)
    );
  });

  it('should register quick convert command', () => {
    const mockContext = {
      subscriptions: []
    };

    extension.activate(mockContext);

    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'objectenvy.quickConvert',
      expect.any(Function)
    );
  });

  it('should deactivate without errors', () => {
    expect(() => {
      extension.deactivate();
    }).not.toThrow();
  });
});
