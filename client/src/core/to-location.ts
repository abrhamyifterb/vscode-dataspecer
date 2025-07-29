import * as vscode from 'vscode';

export interface NormalizedLocation {
	uri: vscode.Uri;
	range: vscode.Range;
}

export function toLocation(x: vscode.Location | vscode.LocationLink): NormalizedLocation {
	if ('targetUri' in x) {
		return { uri: x.targetUri, range: x.targetRange };
	}
	return { uri: x.uri, range: x.range };
}
