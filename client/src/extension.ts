/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
import * as vscode from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';
import { FileSpecScanner } from './services/data/file-spec-scanner';
import { TurtleSpecParser } from './services/data/ttl-spec-parser';
import { LruSpecCache } from './services/data/lru-spec-cache';
import { SpecManager } from './services/data/spec-manager';
import { CodeGenerator } from './services/code-generator/code-generator';

import { Validator } from './validation/validator';
import { TypeScriptProvider } from './language/typescript-provider';
import { LspGateway } from './lsp/lsp-gateway';
import { registerShowClassHierarchyCommand } from './commands/show-hierarchy';

import { JavaProvider } from './language/java-provider';
import { CppProvider } from './language/cpp-provider';

let client: LanguageClient;

export async function activate(context: ExtensionContext) {
	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
		}
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'plaintext' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);

	let workspacePath: string | undefined = context.globalState.get('dataspecer.workspacePath');

	if (!workspacePath) {
		const selectedFolders = await vscode.window.showOpenDialog({
			canSelectFolders: true,
			canSelectFiles: false,
			canSelectMany: false,
			openLabel: 'Select Dataspecer Workspace',
			title: 'Choose a folder for Dataspecer specs',
		});
	
		if (selectedFolders && selectedFolders.length > 0) {
			workspacePath = selectedFolders[0].fsPath;
			await context.globalState.update('dataspecer.workspacePath', workspacePath);
			vscode.window.showInformationMessage(`Dataspecer workspace set to: ${workspacePath}`);
		} else {
			vscode.window.showWarningMessage('No workspace selected. Some features may not work as expected.');
		}
	}

	const scanner = new FileSpecScanner([workspacePath]);
	const parser  = new TurtleSpecParser();
	const cache   = new LruSpecCache();
	const manager = new SpecManager([scanner], parser, cache);

	context.subscriptions.push(
		vscode.commands.registerCommand('dataspecer.reloadSpecs', async () => {
			const models = await manager.loadAll();
			vscode.window.showInformationMessage(`Loaded ${models.length} DSV models`);
		})
	);


	context.subscriptions.push(
		vscode.commands.registerCommand('dataspecer.generateCode', async () => {
			const models = await manager.loadAll();
			const generator = new CodeGenerator(context.extensionPath + '/out');
			const files = await generator.generate(models);
		
			for (const [filePath, content] of files) {
				await vscode.workspace.fs.writeFile(
					vscode.Uri.file(filePath),
					Buffer.from(content, 'utf8')
				);
			}
			vscode.window.showInformationMessage('Code generated for all DSV profiles');
		})
	);
	client.start();
	
	// Start the client. This will also launch the server

	const lsp = new LspGateway(client);

	context.subscriptions.push(
		registerShowClassHierarchyCommand()
	);

	const validator = new Validator(
		manager, 
		[ 
			new TypeScriptProvider(lsp),
			new JavaProvider(lsp),
			new CppProvider(lsp) 
		]	
	);
	const diagCol  = vscode.languages.createDiagnosticCollection('dataspecer');
	context.subscriptions.push(
		diagCol,
		vscode.workspace.onDidOpenTextDocument(doc => validator.validateDocument(doc, diagCol)),
		vscode.workspace.onDidSaveTextDocument(doc => validator.validateDocument(doc, diagCol))
	);
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
