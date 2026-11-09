import { type Dimension, type Entity, type Vector3, world } from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";

export function vector3ToString(v: Vector3): string {
	return `${v.x} ${v.y} ${v.z}`;
}

export function vector3Distance(from: Vector3, to: Vector3): number {
	const dx: number = from.x - to.x;
	const dy: number = from.y - to.y;
	const dz: number = from.z - to.z;
	return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export interface TeleportLocation {
	dimension: Dimension;
	facing: Vector3;
	pos: Vector3;
}

export function teleportLocationToString(loc: TeleportLocation): string {
	return `${loc.dimension.id}: ${vector3ToString(loc.pos)} (Facing ${vector3ToString(loc.facing)})`;
}

export function teleportLocationDefault(): TeleportLocation {
	return {
		dimension: world.getDimension(MinecraftDimensionTypes.Overworld),
		facing: { x: 0.5, y: 0, z: 0.5 },
		pos: { x: 0.5, y: 0, z: 0.5 },
	};
}

export function teleportLocation(entity: Entity, loc: TeleportLocation): void {
	entity.teleport(loc.pos, { dimension: loc.dimension, facingLocation: loc.facing });
}
