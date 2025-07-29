import * as vscode from 'vscode';
import { ClassShape } from '../core/ishapes';

export interface RuleContext {
	doc: vscode.TextDocument;
	spec: ClassShape;
	code: ClassShape;
	locate: (propName: string) => Promise<vscode.Range | undefined>;
}

export interface RuleResult {
	diagnostic: vscode.Diagnostic;
}

export interface Rule {
	id: string;
	run(ctx: RuleContext): Promise<RuleResult[]>;
}
