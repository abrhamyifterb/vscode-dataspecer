import * as vscode from 'vscode';
import { TypeRef } from '../core/code-type';
import { ClassShape, PropertyShape } from '../core/ishapes';
import { ILspGateway } from '../lsp/lsp-gateway';
import { ILanguageProvider } from './ilanguage-provider';
import { TypeResolver } from './type-resolver';

export abstract class BaseLspProvider implements ILanguageProvider {
  abstract readonly languageId: string;

  protected readonly resolver: TypeResolver;

  constructor(
    protected readonly lsp: ILspGateway,
    protected readonly primitiveMap: Record<string, string>,
    protected readonly collectionRegex: RegExp[],
    protected readonly declarationExtractor: (line: string) => string
  ) {
    this.resolver = new TypeResolver(
      lsp,
      primitiveMap,
      collectionRegex,
      declarationExtractor
    );
  }

  supports(doc: vscode.TextDocument): boolean {
    return doc.languageId === this.languageId;
  }

  async extractShapes(doc: vscode.TextDocument): Promise<ClassShape[]> {
    const syms = await this.lsp.symbols(doc.uri);
    const flat = this.flatten(syms);
    const classes = flat.filter(s => this.isClassSymbol(s));

    const shapes: ClassShape[] = [];
    for (const cls of classes) {
		const props: PropertyShape[] = [];
		for (const m of cls.children.filter(c => this.isPropertySymbol(c))) {
			const tr = await this.resolver.resolve(doc, m.selectionRange.start);
			const { multiple, iri } = this.normalizeType(tr);
			props.push({
				name: this.cleanName(m.name),
				isRequired: !this.isOptional(m.name),
				isMultiple: multiple,
				dataType: iri,
				typeRef: tr
			});
		}
		shapes.push({ iri: `#${cls.name}`, name: cls.name, properties: props });
    }

    return shapes;
  }

  async locateProperty(
    doc: vscode.TextDocument,
    className: string,
    propName: string
  ): Promise<vscode.Range | undefined> {
    const syms = await this.lsp.symbols(doc.uri);
    const flat = this.flatten(syms);
    const cls = flat.find(s => this.isClassSymbol(s) && s.name === className);
    const prop = cls?.children.find(
      c => this.isPropertySymbol(c) && this.cleanName(c.name) === propName
    );
    return prop?.selectionRange;
  }

  protected abstract isClassSymbol(sym: vscode.DocumentSymbol): boolean;
  protected abstract isPropertySymbol(sym: vscode.DocumentSymbol): boolean;

  protected normalizeType(tr: TypeRef): { multiple: boolean; iri?: string } {
    switch (tr.kind) {
      case 'primitive':
        return { multiple: false, iri: tr.xsd };
      case 'array': {
        const inner = this.normalizeType(tr.element);
        return { multiple: true, iri: inner.iri };
      }
      case 'object':
        return { multiple: false, iri: tr.name };
      case 'union':
        return tr.options.length > 0
          ? this.normalizeType(tr.options[0])
          : { multiple: false };
      default:
        return { multiple: false };
    }
  }

  private flatten(
    syms: vscode.DocumentSymbol[]
  ): vscode.DocumentSymbol[] {
    return syms.reduce(
      (all, s) => all.concat(s, this.flatten(s.children)),
      [] as vscode.DocumentSymbol[]
    );
  }

  private isOptional(name: string) {
    return /\?$/.test(name);
  }
  private cleanName(name: string) {
    return name.replace(/\?$/, '');
  }
}
