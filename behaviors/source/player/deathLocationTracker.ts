import { Player, type Vector3, world } from "@minecraft/server";

const locations = new Map<string, Vector3>();

world.afterEvents.entityDie.subscribe((event) => {
	if (event.deadEntity instanceof Player === false || !event.deadEntity.isValid) {
		return;
	}
	locations.set(event.deadEntity.id, event.deadEntity.location);
});

export function deathLocationTracker(player: Player): Vector3 | null {
	return locations.get(player.id) ?? null;
}
