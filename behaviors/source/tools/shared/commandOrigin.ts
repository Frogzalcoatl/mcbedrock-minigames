import { type CustomCommandOrigin, type Dimension, Player, type Vector3 } from "@minecraft/server";

export function getPlayerFromOrigin(origin: CustomCommandOrigin): Player | null {
	return origin.initiator instanceof Player
		? origin.initiator
		: origin.sourceEntity instanceof Player
			? origin.sourceEntity
			: null;
}

export function getDimensionFromOrigin(origin: CustomCommandOrigin): Dimension | null {
	const source = origin.sourceBlock ?? origin.sourceEntity ?? origin.initiator;
	if (source === undefined || !source.isValid) {
		return null;
	}
	return source.dimension;
}

export function getLocationFromOrigin(origin: CustomCommandOrigin): Vector3 | null {
	const source = origin.sourceBlock ?? origin.sourceEntity ?? origin.initiator;
	if (source === undefined || !source.isValid) {
		return null;
	}
	return source.location;
}
