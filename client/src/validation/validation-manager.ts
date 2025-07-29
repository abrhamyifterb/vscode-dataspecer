import { Rule, RuleContext } from './rule-types';

export class ValidationManager {
	constructor(private rules: Rule[]) {}

	async run(ctx: RuleContext) {
		const arr = await Promise.all(this.rules.map(r => r.run(ctx)));
		return arr.flat();
	}
}