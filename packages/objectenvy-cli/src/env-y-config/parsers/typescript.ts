/**
 * TypeScript interface/type parser using ts-morph
 * @module parsers/typescript
 */

import {
  Project,
  SourceFile,
  InterfaceDeclaration,
  TypeAliasDeclaration,
  PropertySignature,
  TypeNode,
  SyntaxKind
} from 'ts-morph';
import type { SchemaField, ParsedSchema } from '../types.js';
import { createParseError } from '../utils/errors.js';

/**
 * Parse TypeScript file and extract interface or type definition
 */
export async function parseTypeScriptFile(
  filePath: string,
  exportName?: string
): Promise<ParsedSchema> {
  try {
    const project = new Project({
      compilerOptions: {
        strict: false,
        skipLibCheck: true
      }
    });

    const sourceFile = project.addSourceFileAtPath(filePath);

    // If no export name specified, find the first exported interface or type
    const targetDeclaration = exportName
      ? findNamedExport(sourceFile, exportName)
      : findFirstExport(sourceFile);

    if (!targetDeclaration) {
      const availableExports = listAvailableExports(sourceFile);
      const exportList =
        availableExports.length > 0
          ? `Available exports: ${availableExports.join(', ')}`
          : 'No exported interfaces or types found';

      throw createParseError(
        filePath,
        'typescript',
        exportName
          ? `Export '${exportName}' not found. ${exportList}`
          : `No exported interfaces or types found. ${exportList}`
      );
    }

    const fields = extractFields(targetDeclaration);

    return {
      fields,
      metadata: {
        format: 'typescript',
        fileName: filePath,
        exportName: targetDeclaration.getName()
      }
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'ConversionError') {
      throw error;
    }
    throw createParseError(
      filePath,
      'typescript',
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Find named export in source file
 */
function findNamedExport(
  sourceFile: SourceFile,
  exportName: string
): InterfaceDeclaration | TypeAliasDeclaration | undefined {
  // Try to find interface
  const interfaceDecl = sourceFile.getInterface(exportName);
  if (interfaceDecl && interfaceDecl.isExported()) {
    return interfaceDecl;
  }

  // Try to find type alias
  const typeAlias = sourceFile.getTypeAlias(exportName);
  if (typeAlias && typeAlias.isExported()) {
    return typeAlias;
  }

  return undefined;
}

/**
 * Find first exported interface or type alias
 */
function findFirstExport(
  sourceFile: SourceFile
): InterfaceDeclaration | TypeAliasDeclaration | undefined {
  // Try interfaces first
  const interfaces = sourceFile.getInterfaces().filter((i) => i.isExported());
  if (interfaces.length > 0) {
    return interfaces[0];
  }

  // Try type aliases
  const typeAliases = sourceFile.getTypeAliases().filter((t) => t.isExported());
  if (typeAliases.length > 0) {
    return typeAliases[0];
  }

  return undefined;
}

/**
 * List all available exported interfaces and types
 */
export function listAvailableExports(sourceFile: SourceFile): string[] {
  const exports: string[] = [];

  // Get exported interfaces
  sourceFile.getInterfaces().forEach((iface) => {
    if (iface.isExported()) {
      const name = iface.getName();
      if (name) {
        exports.push(`${name} (interface)`);
      }
    }
  });

  // Get exported type aliases
  sourceFile.getTypeAliases().forEach((typeAlias) => {
    if (typeAlias.isExported()) {
      const name = typeAlias.getName();
      if (name) {
        exports.push(`${name} (type)`);
      }
    }
  });

  return exports;
}

/**
 * List available TypeScript exports from a file
 *
 * @param filePath - Path to TypeScript file
 * @returns Array of export names with their types
 *
 * @example
 * ```typescript
 * const exports = await listTypeScriptExports('config.ts');
 * // ['Config (interface)', 'Settings (type)']
 * ```
 */
export async function listTypeScriptExports(filePath: string): Promise<string[]> {
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(filePath);
  return listAvailableExports(sourceFile);
}

/**
 * Extract fields from interface or type declaration
 */
function extractFields(declaration: InterfaceDeclaration | TypeAliasDeclaration): SchemaField[] {
  const fields: SchemaField[] = [];

  if (declaration.getKind() === SyntaxKind.InterfaceDeclaration) {
    const interfaceDecl = declaration as InterfaceDeclaration;

    // Process properties
    interfaceDecl.getProperties().forEach((prop) => {
      const field = extractFieldFromProperty(prop);
      if (field) {
        fields.push(field);
      }
    });
  } else if (declaration.getKind() === SyntaxKind.TypeAliasDeclaration) {
    const typeAlias = declaration as TypeAliasDeclaration;
    const typeNode = typeAlias.getTypeNode();

    if (typeNode) {
      const field = extractFieldFromTypeNode('root', typeNode, false);
      if (field && field.type === 'object' && field.nested) {
        // If the root is an object, return its nested fields directly
        return field.nested;
      } else if (field) {
        fields.push(field);
      }
    }
  }

  return fields;
}

/**
 * Extract field from property signature
 */
function extractFieldFromProperty(prop: PropertySignature): SchemaField | null {
  const name = prop.getName();
  const typeNode = prop.getTypeNode();
  const isOptional = prop.hasQuestionToken();

  if (!typeNode) {
    return null;
  }

  return extractFieldFromTypeNode(name, typeNode, isOptional);
}

/**
 * Extract field from type node
 */
function extractFieldFromTypeNode(
  name: string,
  typeNode: TypeNode,
  isOptional: boolean
): SchemaField | null {
  const jsDoc = extractJsDoc(typeNode.getParent());

  // Handle different type kinds
  const typeText = typeNode.getText();

  // String type
  if (typeText === 'string' || typeNode.getKind() === SyntaxKind.StringKeyword) {
    return {
      name,
      type: 'string',
      required: !isOptional,
      description: jsDoc
    };
  }

  // Number type
  if (typeText === 'number' || typeNode.getKind() === SyntaxKind.NumberKeyword) {
    return {
      name,
      type: 'number',
      required: !isOptional,
      description: jsDoc
    };
  }

  // Boolean type
  if (typeText === 'boolean' || typeNode.getKind() === SyntaxKind.BooleanKeyword) {
    return {
      name,
      type: 'boolean',
      required: !isOptional,
      description: jsDoc
    };
  }

  // Array type
  if (typeNode.getKind() === SyntaxKind.ArrayType || typeText.endsWith('[]')) {
    return {
      name,
      type: 'array',
      required: !isOptional,
      description: jsDoc
    };
  }

  // Object/interface type literal
  if (typeNode.getKind() === SyntaxKind.TypeLiteral) {
    const typeLiteral = typeNode.asKindOrThrow(SyntaxKind.TypeLiteral);
    const nested: SchemaField[] = [];

    typeLiteral.getProperties().forEach((member) => {
      if (member.getKind() === SyntaxKind.PropertySignature) {
        const propSig = member as PropertySignature;
        const nestedField = extractFieldFromProperty(propSig);
        if (nestedField) {
          nested.push(nestedField);
        }
      }
    });

    return {
      name,
      type: 'object',
      required: !isOptional,
      description: jsDoc,
      nested
    };
  }

  // Union type - treat as string for now
  if (typeNode.getKind() === SyntaxKind.UnionType) {
    return {
      name,
      type: 'string',
      required: !isOptional,
      description: jsDoc
    };
  }

  // Default: treat unknown types as string
  return {
    name,
    type: 'string',
    required: !isOptional,
    description: jsDoc
  };
}

/**
 * Extract JSDoc comment from node
 */
function extractJsDoc(node: any): string | undefined {
  try {
    const jsDocs = node.getJsDocs?.();
    if (jsDocs && jsDocs.length > 0) {
      const comment = jsDocs[0].getComment();
      if (typeof comment === 'string') {
        return comment.trim();
      }
    }
  } catch {
    // Ignore JSDoc extraction errors
  }
  return undefined;
}
