/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';

export async function requestWithFallback<Params, Raw, Conv>(
	client: LanguageClient,
	capability: unknown,
	method: string,
	params: Params,
	convert: (raw: Raw) => Conv,
	fallbackCommand: string,
	fallbackArgs: any[],
	token?: vscode.CancellationToken
): Promise<Conv> {
	if (!capability) {
		return vscode.commands.executeCommand<Conv>(fallbackCommand, ...fallbackArgs);
	}
	try {
		const raw = await client.sendRequest<Raw>(method, params, token);
		return convert(raw);
	} catch (err: any) {
		if (isMethodNotFound(err)) {
			return vscode.commands.executeCommand<Conv>(fallbackCommand, ...fallbackArgs);
		}
		throw err;
	}
}

export function isMethodNotFound(e: any) {
	return e?.code === -32601 || /method not found/i.test(e?.message);
}


export function toLocation(item: vscode.Location | vscode.LocationLink) {
	if ('targetUri' in item) {
		return { uri: item.targetUri, range: item.targetSelectionRange ?? item.targetRange };
	}
	return { uri: item.uri, range: item.range };
}