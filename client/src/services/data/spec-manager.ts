import { Uri , workspace as ws } from 'vscode';
import { watch } from 'chokidar';
import { DsvModel } from '../dataspecer/dsv-model';
import { ISpecCache } from '../interfaces/ispec-cache';
import { ISpecParser } from '../interfaces/ispec-parser';
import { ISpecScanner } from '../interfaces/ispec-scanner';

export class SpecManager {
	constructor(
		private readonly scanners: ISpecScanner[],
		private readonly parser: ISpecParser,
		private readonly cache: ISpecCache
	) {
		const watcher = watch('**/*.{ttl}');
		watcher.on('change', path => this.cache.invalidate(path));
		watcher.on('unlink', path => this.cache.invalidate(path));
	}

	async loadAll(): Promise<DsvModel[]> {
		let uris: Uri[] = (await Promise.all(this.scanners.map(s => s.findSpecs()))).flat();
		const allModels: DsvModel[] = [];
		if (uris.length === 0) {
			// abolute path to file - dev mode for testing incase ws
			const defaultPath = Uri.file('../../dscme-dsv-1750101248376.ttl'); 
			
			uris = [defaultPath];
		}
		for (const uri of uris) {
			
			const key = uri.toString();
			let models = this.cache.get(key);
			if (!models) {
				const content = (await ws.fs.readFile(uri)).toString();
				models = await this.parser.parse(uri, content);
				this.cache.set(key, models);
			}
			allModels.push(...models);
		}
		return allModels;
	}
}