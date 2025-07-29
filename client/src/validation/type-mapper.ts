import { ClassShape } from '../core/ishapes';

export class TypeMapper {
	private readonly nameToIri = new Map<string,string>();
	constructor(specClasses: ClassShape[]) {
		for (const c of specClasses) {
		this.nameToIri.set(c.name, c.iri);
    }
	}
	toIri(name?: string) {
		if (!name) {
			return undefined;
		}
		if (name.startsWith('xsd:')) {
			return name;
		}
		return this.nameToIri.get(name);
	}
}