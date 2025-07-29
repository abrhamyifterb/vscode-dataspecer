import { DsvModel } from '../dataspecer/dsv-model';

export interface ISpecCache {
	get(key: string): DsvModel[] | undefined;
	set(key: string, value: DsvModel[]): void;
	invalidate(key: string): void;
}
