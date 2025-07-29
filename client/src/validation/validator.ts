import * as vscode from 'vscode';
import { ValidationManager } from './validation-manager';
import { MissingPropertyRule } from './rules/missing-property';
// import { CardinalityRule } from './rules/cardinality-check';
import { SpecManager } from '../services/data/spec-manager';
import { ILanguageProvider } from '../language/ilanguage-provider';
import { DatatypeRule } from './rules/datatype-check';
import { classProfileToShape } from '../core/spec-to-shape';

export class Validator {
  private readonly engine = new ValidationManager([
    MissingPropertyRule,
    DatatypeRule,
   // CardinalityRule
  ]);

  constructor(
    private readonly specs: SpecManager,
    private readonly providers: ILanguageProvider[]
  ) {}

  async validateDocument(doc: vscode.TextDocument, diags: vscode.DiagnosticCollection) {
    diags.delete(doc.uri);

    const provider = this.providers.find(p => p.supports(doc));
    if (!provider) {return;}

    const specModels = await this.specs.loadAll();
    const specShapes = specModels.flatMap(m => m.profiles).map(classProfileToShape);
    // console.dir(specShapes);
    const codeShapes = await provider.extractShapes(doc);
    
    const diagnostics: vscode.Diagnostic[] = [];

    for (const codeCls of codeShapes) {
      const spec = specShapes.find(s => s.name === codeCls.name);
      if (!spec) {continue;}
      const results = await this.engine.run({
        doc,
        spec,
        code: codeCls,
        locate: (prop) => provider.locateProperty(doc, codeCls.name, prop)
      });

      diagnostics.push(...results.map(r => r.diagnostic));
    }

    diags.set(doc.uri, diagnostics);
  }
}
