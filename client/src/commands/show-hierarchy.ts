/* eslint-disable no-useless-escape */
import * as vscode from 'vscode';

interface Node {
  name: string;
  type?: string;
  properties: Node[];
}

export function registerShowClassHierarchyCommand(): vscode.Disposable {
  return vscode.commands.registerCommand(
    'dataspecer.showFullHierarchy',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return vscode.window.showErrorMessage('No active editor');
      }
      const doc = editor.document;
      const lang = doc.languageId;
      const wsFolder = vscode.workspace
        .getWorkspaceFolder(doc.uri)?.uri.fsPath;

      const docSyms = await vscode.commands.executeCommand<
        vscode.DocumentSymbol[]
      >('vscode.executeDocumentSymbolProvider', doc.uri);
      if (!docSyms) {
        return vscode.window.showErrorMessage(
          'No symbols in this file'
        );
      }
      const flatDocSyms = flatten(docSyms);

      const types = flatDocSyms.filter(s =>
        s.kind === vscode.SymbolKind.Class || 
        s.kind === vscode.SymbolKind.Struct ||
        s.kind === vscode.SymbolKind.Interface
      );
      if (types.length === 0) {
        return vscode.window.showInformationMessage(
          'No classes/interfaces found'
        );
      }
      const picked = types[0].name;
      if (!picked) {return;}

      const symbolCache = new Map<string, vscode.DocumentSymbol[]>();
      symbolCache.set(doc.uri.toString(), flatDocSyms);

      async function buildNode(
        typeName: string,
        seen = new Set<string>()
      ): Promise<Node> {
        if (seen.has(typeName)) {
          return { name: typeName, properties: [] };
        }
        seen.add(typeName);

        const td = await vscode.commands.executeCommand<
          vscode.Location | vscode.LocationLink | null
        >('vscode.executeTypeDefinitionProvider', doc.uri, findPosition(typeName));
        let loc: vscode.Location | null = null;
        if (td) {
          if (Array.isArray(td)) {
            const first = td[0] as vscode.LocationLink;
            if(first) {
              loc = 'targetUri' in first
                ? new vscode.Location(first.targetUri, first.targetRange)
                : (first as vscode.Location);
            }
          } else if (td && 'targetUri' in td) {
            loc = new vscode.Location(td.targetUri, td.targetRange);
          } else {
            loc = td as vscode.Location;
          }
        }

        if (!loc) {
          const df = await vscode.commands.executeCommand<
            vscode.Location | vscode.LocationLink
          >('vscode.executeDefinitionProvider', doc.uri, findPosition(typeName));
          if (df && Array.isArray(df)) {
            const first = df[0] as vscode.LocationLink;
            if(first) {
              loc = 'targetUri' in first
                ? new vscode.Location(first.targetUri, first.targetRange)
                : (first as vscode.Location);
            }
          }
        }
        if (!loc) {
          const ws = await vscode.commands.executeCommand<
            vscode.SymbolInformation[]
          >('vscode.executeWorkspaceSymbolProvider', typeName);
          const match = ws?.find(si =>
            si.name === typeName &&
            (
              si.kind === vscode.SymbolKind.Class ||  
              si.kind === vscode.SymbolKind.Struct ||
              si.kind === vscode.SymbolKind.Interface) &&
              si.location.uri.fsPath.startsWith(wsFolder || 
              ''
            )
          );
          if (!match) {
            return { name: typeName, properties: [] };
          }
          loc = match.location;
        }

        const uriStr = loc.uri.toString();
        let fileSyms = symbolCache.get(uriStr);
        if (!fileSyms) {
          const ds = await vscode.commands.executeCommand<
            vscode.DocumentSymbol[]
          >('vscode.executeDocumentSymbolProvider', loc.uri);
          if (!ds) {
            return { name: typeName, properties: [] };
          }
          fileSyms = flatten(ds);
          symbolCache.set(uriStr, fileSyms);
        }

        const clsSym = fileSyms.find(s =>
          (s.kind === vscode.SymbolKind.Class ||
            s.kind === vscode.SymbolKind.Struct ||
            s.kind === vscode.SymbolKind.Interface) &&
          s.selectionRange.contains(loc!.range.start)
        );
        if (!clsSym) {
          return { name: typeName, properties: [] };
        }

        const members = flatten([clsSym]).filter(s =>
          s.kind === vscode.SymbolKind.Property ||
          s.kind === vscode.SymbolKind.Field
        );

        const props: Node[] = [];
        for (const m of members) {
          const text = (
            await vscode.workspace.openTextDocument(loc!.uri)
          ).lineAt(m.selectionRange.start.line).text;
          const token = extractTypeToken(text, lang);

          let inner = token;
          const gen = token.match(/^(.*?)<\s*(.+?)\s*>$/);
          if (gen) {
            inner = gen[2];
          } else if (token.endsWith('[]')) {
            inner = token.slice(0, -2);
          }

          if (/^[A-Z]\w*$/.test(inner) && (await symbolExists(inner))) {
            const child = await buildNode(inner, seen);
            props.push({
              name: m.name,
              type: token,
              properties: child.properties
            });
          } else {
            props.push({
              name: m.name,
              type: token,
              properties: []
            });
          }
        }

        return { name: typeName, properties: props };
      }

      function flatten(
        syms: vscode.DocumentSymbol[]
      ): vscode.DocumentSymbol[] {
        return syms.reduce(
          (all, s) => all.concat(s, flatten(s.children)),
          [] as vscode.DocumentSymbol[]
        );
      }

      async function symbolExists(name: string): Promise<boolean> {
        const ws = await vscode.commands.executeCommand<
          vscode.SymbolInformation[]
        >('vscode.executeWorkspaceSymbolProvider', name);
        return !!ws?.find(si => si.name === name);
      }

      function findPosition(typeName: string): vscode.Position {
        const txt = doc.getText();
        const idx = txt.indexOf(typeName);
        if (idx < 0) {
          return new vscode.Position(0, 0);
        }
        return doc.positionAt(idx);
      }

      function extractTypeToken(line: string, lang: string): string {
        if (lang === 'typescript' || lang === 'javascript') {
          const m = line.match(/:\s*([^;]+)/);
          return m ? m[1].trim() : '';
        }
        if (lang === 'java' || lang === 'csharp' || lang === 'go') {
          const m = line
            .trim()
            .match(/^(?:public|private|protected|static|final|\s)*([\w<>\[\]]+)\s+\w+/);
          return m ? m[1].trim() : '';
        }
        if (lang === 'cpp' || lang === 'c' || lang === 'c++') {
          const m = line
            .trim()
            .match(/^([\w:]+(?:<.+?>)?(?:\[\])?)\s+\w+/);
          return m ? m[1].trim() : '';
        }

        const m = line.match(/:\s*([^;]+)/);
        return m ? m[1].trim() : '';
      }

      const tree = await buildNode(picked);
      const json = JSON.stringify(tree, null, 2);
      console.log('Hierarchy - Generated:', json);
      vscode.window.showInformationMessage('Hierarchy logged to console.');
    }
  );
}