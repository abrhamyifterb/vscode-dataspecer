/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from 'vscode';
import { TypeRef } from '../core/code-type';
import { ILspGateway } from '../lsp/lsp-gateway';

export class TypeResolver {
  private readonly hoverCache = new Map<string, string>();

  constructor(
    private readonly lsp: ILspGateway,
    private readonly primitiveMap: Record<string, string>,
    private readonly collectionRegex: RegExp[],
    private readonly declarationExtractor: (line: string) => string
  ) {}

  async resolve(
    doc: vscode.TextDocument,
    pos: vscode.Position
  ): Promise<TypeRef> {
    const tdefs = await this.lsp.typeDefinition(doc.uri, pos);
    if (tdefs.length) {
      const line = await this.readDeclarationLine(tdefs[0]);
      return this.parseType(this.declarationExtractor(line));
    }

    const defs = await this.lsp.definition(doc.uri, pos);
    if (defs.length) {
      const line = await this.readDeclarationLine(defs[0]);
      return this.parseType(this.declarationExtractor(line));
    }

    const key = `${doc.uri.toString()}#${pos.line}:${pos.character}`;
    let hoverText = this.hoverCache.get(key);
    if (!hoverText) {
      const h = await this.lsp.hover(doc.uri, pos);
      hoverText = (h?.contents ?? [])
        .map(c => (typeof c === 'string' ? c : c.value))
        .join('\n');
      this.hoverCache.set(key, hoverText);
    }
    return this.parseType(this.declarationExtractor(hoverText));
  }

  private async readDeclarationLine(
    locOrLink: vscode.Location | vscode.LocationLink
  ): Promise<string> {
    const loc = 'targetUri' in locOrLink
      ? new vscode.Location(locOrLink.targetUri, locOrLink.targetRange.start)
      : locOrLink as vscode.Location;
    const doc = await vscode.workspace.openTextDocument(loc.uri);
    return doc.lineAt(loc.range.start.line).text;
  }

  private parseType(token: string): TypeRef {
    for (const rx of this.collectionRegex) {
      if (rx.test(token)) {
        let inner = token;
        if (token.endsWith('[]')) {
          inner = token.slice(0, -2);
        } else {
          const gm = token.match(/<\s*(.+?)\s*>/);
          if (gm) {inner = gm[1];}
        }
        return {
          kind: 'array',
          element: this.parseType(inner)
        };
      }
    }

    for (const [langType, xsd] of Object.entries(this.primitiveMap)) {
      if (new RegExp(`\\b${langType}\\b`).test(token)) {
        return { kind: 'primitive', xsd: xsd as any };
      }
    }

    if (/^[A-Za-z_]\w*$/.test(token)) {
      return { kind: 'object', name: token };
    }
    
    return { kind: 'unknown', raw: token };
  }
}
