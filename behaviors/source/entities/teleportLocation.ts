import type { Vector3 } from "@minecraft/server";

export interface TeleportLocation {
	facing: Vector3;
	pos: Vector3;
}

export function teleportLocationToString(spawn: TeleportLocation): string {
	return `${spawn.pos.x} ${spawn.pos.y} ${spawn.pos.z} (Facing: ${spawn.facing.x} ${spawn.facing.y} ${spawn.facing.z})`;
}
