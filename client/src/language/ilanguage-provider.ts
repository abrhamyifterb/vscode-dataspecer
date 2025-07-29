import * as vscode from 'vscode';
import { ClassShape } from '../core/ishapes';

export interface ILanguageProvider {
	languageId: string;
	supports(doc: vscode.TextDocument): boolean;
	extractShapes(doc: vscode.TextDocument): Promise<ClassShape[]>;
	locateProperty(doc: vscode.TextDocument, className: string, propName: string): Promise<vscode.Range | undefined>;
}