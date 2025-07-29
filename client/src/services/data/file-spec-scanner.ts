import { workspace, Uri } from 'vscode';
import { ISpecScanner } from '../interfaces/ispec-scanner';

export class FileSpecScanner implements ISpecScanner {
	constructor(private patterns = ['**/*.ttl']) {}

	async findSpecs(): Promise<Uri[]> {
		const glob = `{${this.patterns.join(',')}}`;
		return workspace.findFiles(glob);
	}
}
