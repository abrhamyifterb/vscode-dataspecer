/* eslint-disable @typescript-eslint/no-explicit-any */
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): () => void {
	let timer: NodeJS.Timeout | undefined;
	return () => {
		if (timer) {
			clearTimeout(timer);
		}
		timer = setTimeout(() => fn(), delay);
	};
}
