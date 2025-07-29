import * as vscode from 'vscode';
import { BaseLspProvider } from './base-language-provider';
import { ILspGateway } from '../lsp/lsp-gateway';

export class TypeScriptProvider extends BaseLspProvider {
	protected declarationExtractor: (line: string) => string;
	languageId = 'typescript';

	constructor(lsp: ILspGateway) {
		super(
			lsp,
			{ string:'xsd:string', number:'xsd:decimal', boolean:'xsd:boolean' },
			[ /\[\]$/, /^Array<.+>$/, /^Set<.+>$/ ],
			line => (RegExp(/:\s*([^;]+)/).exec(line)?.[1] ?? '').trim()
		);
	}

	protected isClassSymbol(sym: vscode.DocumentSymbol) {
		return sym.kind === vscode.SymbolKind.Class || sym.kind === vscode.SymbolKind.Interface;
	}
	protected isPropertySymbol(sym: vscode.DocumentSymbol) {
		return sym.kind === vscode.SymbolKind.Property;
	}
}