import type { Vector3 } from "@minecraft/server";

export function vector3ToString(v: Vector3): string {
	return `${v.x} ${v.y} ${v.z}`;
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
