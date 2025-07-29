/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';
import { requestWithFallback, isMethodNotFound } from './safe-request';
import { normSymbols, pickDocumentSymbols, normDef } from './normalize';

export type DefResult = (vscode.Location | vscode.LocationLink)[];
export type SymResult = vscode.DocumentSymbol[];

export interface ILspGateway {
  symbols(uri: vscode.Uri, token?: vscode.CancellationToken): Promise<SymResult>;
  hover(uri: vscode.Uri, pos: vscode.Position, token?: vscode.CancellationToken): Promise<vscode.Hover | undefined>;
  definition(uri: vscode.Uri, pos: vscode.Position, token?: vscode.CancellationToken): Promise<DefResult>;
  typeDefinition(uri: vscode.Uri, pos: vscode.Position, token?: vscode.CancellationToken): Promise<DefResult>;
}

export class LspGateway implements ILspGateway {
  private readonly caps = this.client.initializeResult?.capabilities ?? {};
  constructor(private readonly client: LanguageClient) {}

  async symbols(uri: vscode.Uri, token?: vscode.CancellationToken): Promise<SymResult> {
    const convert = normSymbols(raw => this.client.protocol2CodeConverter.asDocumentSymbols(raw));
    const res = await requestWithFallback<any, any, SymResult>(
      this.client,
      this.caps.documentSymbolProvider,
      'textDocument/documentSymbol',
      { textDocument: { uri: uri.toString() } },
      convert,
      'vscode.executeDocumentSymbolProvider',
      [uri],
      token
    );
    if (res.length) {return res;}

    const raw = await vscode.commands.executeCommand<any>('vscode.executeDocumentSymbolProvider', uri);
    return pickDocumentSymbols(raw);
  }

  async hover(uri: vscode.Uri, pos: vscode.Position, token?: vscode.CancellationToken) {
    const fallback = () =>
      vscode.commands.executeCommand<vscode.Hover[]>('vscode.executeHoverProvider', uri, pos)
        .then(hs => hs?.[0]);

    if (!this.caps.hoverProvider) {return fallback();}
    try {
      const raw = await this.client.sendRequest<any>(
        'textDocument/hover',
        { textDocument: { uri: uri.toString() }, position: this.client.code2ProtocolConverter.asPosition(pos) },
        token
      );
      return this.client.protocol2CodeConverter.asHover(raw);
    } catch (err: any) {
      if (isMethodNotFound(err)) {return fallback();}
      throw err;
    }
  }

  async definition(uri: vscode.Uri, pos: vscode.Position, token?: vscode.CancellationToken): Promise<DefResult> {
    const convert = normDef(raw => this.client.protocol2CodeConverter.asDefinitionResult(raw));
    return requestWithFallback<any, any, DefResult>(
      this.client,
      this.caps.definitionProvider,
      'textDocument/definition',
      { textDocument: { uri: uri.toString() }, position: this.client.code2ProtocolConverter.asPosition(pos) },
      convert,
      'vscode.executeDefinitionProvider',
      [uri, pos],
      token
    );
  }

  async typeDefinition(uri: vscode.Uri, pos: vscode.Position, token?: vscode.CancellationToken): Promise<DefResult> {
    const convert = normDef(raw => this.client.protocol2CodeConverter.asDefinitionResult(raw));
    return requestWithFallback<any, any, DefResult>(
      this.client,
      this.caps.typeDefinitionProvider,
      'textDocument/typeDefinition',
      { textDocument: { uri: uri.toString() }, position: this.client.code2ProtocolConverter.asPosition(pos) },
      convert,
      'vscode.executeTypeDefinitionProvider',
      [uri, pos],
      token
    );
  }
}