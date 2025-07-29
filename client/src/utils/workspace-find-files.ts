import { workspace, Uri } from 'vscode';

export async function scanWorkspace(globPattern: string): Promise<Uri[]> {
	return workspace.findFiles(globPattern);
}
