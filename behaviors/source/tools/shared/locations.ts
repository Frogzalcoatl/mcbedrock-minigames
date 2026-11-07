import type { Vector3 } from "@minecraft/server";

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
	facing: Vector3;
	pos: Vector3;
}

export function teleportLocationToString(spawn: TeleportLocation): string {
	return `${vector3ToString(spawn.pos)} (Facing ${vector3ToString(spawn.facing)})`;
}

export function teleportLocationDefault(): TeleportLocation {
	return {
		facing: { x: 0.5, y: 0, z: 0.5 },
		pos: { x: 0.5, y: 0, z: 0.5 },
	};
}
