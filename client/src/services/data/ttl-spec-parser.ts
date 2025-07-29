/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Uri } from 'vscode';
import { ISpecParser } from '../interfaces/ispec-parser';
import { rdfToConceptualModel } from '../dataspecer/rdf-to-dsv';

export class TurtleSpecParser implements ISpecParser {
	async parse(uri: Uri, content: string) {
		return rdfToConceptualModel(content);
	}
}