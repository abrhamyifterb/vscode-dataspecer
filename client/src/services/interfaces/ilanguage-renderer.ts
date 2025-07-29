import { DataStructure } from '../../utils/data-structure';

export interface ILanguageRenderer {
	outDirName: string;
	extension: string;
	render(cls: DataStructure): string;
}
