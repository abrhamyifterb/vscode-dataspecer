import {
	ClassProfile,
	PropertyProfile,
	isDatatypePropertyProfile,
	isObjectPropertyProfile,
	Cardinality,
	RequirementLevel,
} from '../services/dataspecer/dsv-model';
import { ClassShape, PropertyShape } from './ishapes';

export function classProfileToShape(cp: ClassProfile): ClassShape {
	return {
		iri: cp.iri,
		name: local(cp.iri),
		properties: cp.properties.map(propertyProfileToShape),
	};
}

function propertyProfileToShape(pp: PropertyProfile): PropertyShape {
	const flags = cardinalityToFlags(pp.cardinality, pp.requirementLevel);

	let dt: string | undefined;
	if (isDatatypePropertyProfile(pp)) {
		dt = pp.rangeDataTypeIri?.[0];
	} else if (isObjectPropertyProfile(pp)) {
		dt = pp.rangeClassIri?.[0];
	}

	return {
		iri: pp.iri,
		name: local(pp.iri),
		isRequired: flags.required,
		isMultiple: flags.multiple,
		dataType: dt,
	};
}

function cardinalityToFlags(c: Cardinality | null, rl: RequirementLevel) {
	const requiredFromRL = rl === RequirementLevel.mandatory;
	if (!c) {
		return { 
			required: requiredFromRL, 
			multiple: false 
		};
	}
	const [min, max] = c.split('-');
	return { 
		required: min === '1' || requiredFromRL, 
		multiple: max === 'n' 
	};
}

// eslint-disable-next-line no-useless-escape
const local = (iri: string) => iri.split(/[#\/]/).pop()!;
