import { LRUCache } from 'lru-cache';
import { ISpecCache } from '../interfaces/ispec-cache';
import { DataStructure } from '../../utils/data-structure';

export class LruSpecCache implements ISpecCache {
	private cache = new LRUCache<string, DataStructure[]>({
		max: 100,                   
		ttl: 3600_00
	});

	get(key: string): DataStructure[] | undefined {
		return this.cache.get(key);
	}
	set(key: string, value: DataStructure[]): void {
		this.cache.set(key, value);
	}
	invalidate(key: string): void {
		this.cache.delete(key);
	}
}
