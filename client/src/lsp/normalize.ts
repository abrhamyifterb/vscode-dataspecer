/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from 'vscode';

export const normDef = (conv: (raw: any) => any) =>
	(raw: any): (vscode.Location | vscode.LocationLink)[] => conv(raw) ?? [];

export const normSymbols = (conv: (raw: any) => any) =>
	(raw: any): vscode.DocumentSymbol[] => Array.isArray(conv(raw)) ? conv(raw) : [];

export function pickDocumentSymbols(res: any): vscode.DocumentSymbol[] {
	if (!Array.isArray(res)) {return [];}
	return res.filter((x: any): x is vscode.DocumentSymbol => !!x && Array.isArray(x.children));
}