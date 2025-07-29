import { Rule, RuleResult } from '../rule-types';
import * as vscode from 'vscode';

export const CardinalityRule: Rule = {
	id: 'cardinality-check',
	async run(ctx) {
		const results: RuleResult[] = [];
		const codeMap = new Map(ctx.code.properties.map(p => [p.name, p]));
		// console.dir(codeMap);
		for (const sp of ctx.spec.properties) {
			const cp = codeMap.get(sp.name.split(".").pop() || sp.name);

			if (!cp) continue;

			const range = await ctx.locate(sp.name.split(".").pop() || sp.name) ?? new vscode.Range(0,0,0,1);

			if (sp.isMultiple !== cp.isMultiple) {
				results.push({
					diagnostic: new vscode.Diagnostic(
						range,
						`Cardinality mismatch for '${sp.name}' (spec: ${sp.isMultiple ? 'multi' : 'single'}, code: ${cp.isMultiple ? 'multi' : 'single'}).`,
						vscode.DiagnosticSeverity.Error
					)
				});
			}
		}
		return results;
	}
};
