import * as vscode from 'vscode';
import { BaseLspProvider } from './base-language-provider';
import { ILspGateway } from '../lsp/lsp-gateway';

export class CppProvider extends BaseLspProvider {
	protected declarationExtractor: (line: string) => string;
	languageId = 'java';

	constructor(lsp: ILspGateway) {
		super(
			lsp,
			{
				bool:    'xsd:boolean',
				char:    'xsd:string',
				wchar_t: 'xsd:string',
				short:   'xsd:short',
				int:     'xsd:integer',
				long:    'xsd:long',
				float:   'xsd:decimal',
				double:  'xsd:double',
				basic_string: 'xsd:string'
			},
			[
				/^std::vector<.+>$/,
				/^std::list<.+>$/,
				/^std::set<.+>$/,
				/^std::deque<.+>$/,
				/^std::array<.+>$/,   
				/\[\]$/
			],
			line => (RegExp(/:\s*([^;]+)/).exec(line)?.[1] ?? '').trim()
		);
	}

	protected isClassSymbol(sym: vscode.DocumentSymbol) {
		return sym.kind === vscode.SymbolKind.Class || sym.kind === vscode.SymbolKind.Struct;
	}
	protected isPropertySymbol(sym: vscode.DocumentSymbol) {
		return sym.kind === vscode.SymbolKind.Property || sym.kind === vscode.SymbolKind.Field;
	}
}