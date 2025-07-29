import { Rule, RuleResult } from '../rule-types';
import * as vscode from 'vscode';

export const MissingPropertyRule: Rule = {
	id: 'missing-property',
	async run(ctx) {
		const results: RuleResult[] = [];
		const codeProps = new Set(ctx.code.properties.map(p => p.name));
		for (const sp of ctx.spec.properties) {
			if (!codeProps.has(sp.name.split(".").pop() || sp.name)) {
				const range = new vscode.Range(0,0,0,1);
				results.push({
					diagnostic: new vscode.Diagnostic(
						range,
						`Missing field '${sp.name}' (required by spec).`,
						vscode.DiagnosticSeverity.Error
					)
				});
			}
		}
		return results;
	}
};
