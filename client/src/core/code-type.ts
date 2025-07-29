export type PrimitiveKind = 'xsd:string'|'xsd:decimal'|'xsd:boolean'|'xsd:integer'|'xsd:double'|'xsd:dateTime'|'xsd:date';

export type TypeRef =
	| { kind: 'primitive'; xsd: PrimitiveKind }
	| { kind: 'array'; element: TypeRef }
	| { kind: 'object'; name: string; iri?: string }
	| { kind: 'union'; options: TypeRef[] }
	| { kind: 'unknown'; raw: string }; 