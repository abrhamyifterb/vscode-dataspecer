export interface StructureProperty {
	iri: string;
	technicalName: string;
	prefLabel: { lang: string; value: string }[];
	definition: { lang: string; value: string }[];
	usageNote: Record<string, string>;
	cardinality: string;
	requirementLevel: number;
	rangeClassIri: string[];
	rangeDataTypeIri: string[];
	profiledPropertyIri: string[];
	reusesPropertyValue: {
		reusedPropertyIri: string;
		propertyReusedFromResourceIri: string;
	}[];
	isMultiple: boolean;
	isRequired: boolean;
}
