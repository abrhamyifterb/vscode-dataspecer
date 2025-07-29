import { TypeRef } from './code-type';

export interface ClassShape {
	iri: string;            
	name: string;
	properties: PropertyShape[];
}

export interface PropertyShape {
	iri?: string;   
	name: string;
	isRequired: boolean;
	isMultiple: boolean;
	dataType?: string;
	typeRef?: TypeRef;
}
