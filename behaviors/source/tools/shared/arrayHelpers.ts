export function arrRemoveSwap<T>(arr: T[], val: T): boolean {
	const i = arr.indexOf(val);
	if (i === -1) {
		return false;
	}
	const lastValue: T | undefined = arr[arr.length - 1];
	if (lastValue !== undefined) {
		arr[i] = lastValue;
		arr.pop();
	}
	return true;
}

// Removes first index at which callback returns true
// Returns removed value or undefined if no value was removed
export function arrRemoveByCallback<T>(arr: T[], callback: (current: T) => boolean): T | undefined {
	for (let i = 0; i < arr.length; i++) {
		const current: T | undefined = arr[i];
		if (current === undefined) {
			continue;
		}
		if (callback(current)) {
			const lastValue: T | undefined = arr[arr.length - 1];
			if (lastValue !== undefined) {
				arr[i] = lastValue;
				arr.pop();
			}
			return current;
		}
	}
	return undefined;
}

export function arrRemoveIndexSwap<T>(arr: T[], i: number): T | undefined {
	const lastValue: T | undefined = arr[arr.length - 1];
	if (lastValue !== undefined) {
		arr[i] = lastValue;
		return arr.pop();
	}
	return undefined;
}
