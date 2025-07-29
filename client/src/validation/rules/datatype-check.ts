import { Rule } from '../rule-types';
import * as vscode from 'vscode';
import { TypeMapper } from '../type-mapper';

export const DatatypeRule: Rule = {
  id: 'datatype-check',
  async run(ctx) {
    const results = [];
    const codeMap = new Map(ctx.code.properties.map(p => [p.name, p]));
    const mapper = new TypeMapper([ctx.spec]);

    for (const sp of ctx.spec.properties) {
      const cp = codeMap.get(sp.name.split(".").pop() || sp.name);
      if (!cp) {
        continue;
      }
      // console.dir(cp);
      const range = await ctx.locate(sp.name.split(".").pop() || sp.name) ?? new vscode.Range(0,0,0,1);

      const specDt = sp.dataType ? mapper.toIri(sp.dataType) ?? sp.dataType : undefined;
      const codeDt = cp.dataType ? mapper.toIri(cp.dataType) ?? cp.dataType : undefined;

      if (specDt && codeDt && specDt !== codeDt) {
        results.push({
          diagnostic: new vscode.Diagnostic(
            range,
            `Type mismatch for '${sp.name}' (spec: ${specDt}, code: ${codeDt}).`,
            vscode.DiagnosticSeverity.Error
          )
        });
      }
    }
    return results;
  }
};
