import * as path from 'path';
import { ClassProfileType, DsvModel } from '../dataspecer/dsv-model';
import { ICodeGenerator } from '../interfaces/icode-generator';
import { renderTypeScript } from './typescript-code-renderer';

export class CodeGenerator implements ICodeGenerator {
	constructor(private outDir: string) {}

	async generate(models: DsvModel[]): Promise<Map<string,string>> {
		const result = new Map<string,string>();
		for (const model of models) {
			for (const cls of model.profiles) {
				if (!cls['$type'].includes(ClassProfileType)) continue;
				const tsCode = renderTypeScript(cls);
				// eslint-disable-next-line no-useless-escape
				const tsPath = path.join(this.outDir, 'typescript', `${cls.iri.split(/[#\/]/).pop()!}.ts`);
				result.set(tsPath, tsCode);
			}
		}
		return result;
	}
}