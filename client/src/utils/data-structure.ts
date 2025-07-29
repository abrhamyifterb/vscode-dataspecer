import { StructureProperty } from './structure-property';

export interface DataStructure {
	iri: string;
	technicalName: string;
	prefLabel: Record<string, string>;
	definition: Record<string, string>;
	usageNote: Record<string, string>;
	cardinality: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	profiles: any; 
	requirementLevel?: number;
	properties: StructureProperty[];
}
