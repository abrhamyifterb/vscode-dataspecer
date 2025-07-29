import { ClassProfile } from '../dataspecer/dsv-model';


export function renderTypeScript(cls: ClassProfile): string {
	// eslint-disable-next-line no-useless-escape
	const name = cls.iri.split(/[#\/]/).pop()!;
	const lines: string[] = [];
	lines.push(`export interface ${name} {`);

	for (const prop of cls.properties) {
	  	// eslint-disable-next-line no-useless-escape
		let propName = prop.iri.split(/[#\/]/).pop() || prop.iri; 
		propName = propName.split(".").pop() || propName;
		const optional = prop.isRequired ? '' : '?';

		let tsType = 'any';
		if (prop?.dataType && (prop?.dataType as string)?.endsWith('string')) {tsType = 'string';}
		else if ((prop?.dataType as string)?.endsWith('decimal')) {tsType = 'number';}
		else if (prop.isMultiple) {
			tsType = `${propName}[]`;
		}
		else {
			tsType = (prop?.dataType as string)?.split('#').pop() || 'any';
		}
		lines.push(`  ${propName}${optional}: ${tsType};`);
	}

	lines.push(`}`);
	return lines.join('\n');
}