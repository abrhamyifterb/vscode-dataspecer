import type { Uri } from 'vscode';
import { DsvModel } from '../dataspecer/dsv-model';

export interface ISpecParser {
	parse(uri: Uri, content: string): Promise<DsvModel[]>;
}
