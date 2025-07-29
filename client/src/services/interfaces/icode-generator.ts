import { DsvModel } from '../dataspecer/dsv-model';

export interface ICodeGenerator {
	generate(models: DsvModel[]): Promise<Map<string, string>>;
}
