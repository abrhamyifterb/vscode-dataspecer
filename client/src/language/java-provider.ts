import * as vscode from 'vscode';
import { BaseLspProvider } from './base-language-provider';
import { ILspGateway } from '../lsp/lsp-gateway';

export class JavaProvider extends BaseLspProvider {
	protected declarationExtractor: (line: string) => string;
	languageId = 'java';

	constructor(lsp: ILspGateway) {
		super(
			lsp,
			{
				String:      'xsd:string',
				Date:        'xsd:date',
				string:      'xsd:string',
				int:         'xsd:integer',
				long:        'xsd:long',
				boolean:     'xsd:boolean',
				double:      'xsd:double',
				float:       'xsd:decimal',
			},
			[
				/\[\]$/,
				/^List<.+>$/,
				/^Set<.+>$/, 
				/^Collection<.+>$/, 
				/^Map<.+>$/,
				/^Optional<.+>$/, 
			],
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