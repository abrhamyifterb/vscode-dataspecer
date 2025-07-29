import type { Uri } from 'vscode';

export interface ISpecScanner {
	findSpecs(): Promise<Uri[]>;
}
