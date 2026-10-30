import {
	type EntityDieAfterEvent,
	Player,
	type PlayerLeaveAfterEvent,
	type Vector3,
	world,
} from "@minecraft/server";

const deathLocations = new Map<string, Vector3>();

world.afterEvents.entityDie.subscribe((event: EntityDieAfterEvent) => {
	if (event.deadEntity instanceof Player === false || !event.deadEntity.isValid) {
		return;
	}
	deathLocations.set(event.deadEntity.id, event.deadEntity.location);
});

world.afterEvents.playerLeave.subscribe((event: PlayerLeaveAfterEvent) => {
	deathLocations.delete(event.playerId);
});

export function deathLocationTracker(player: Player): Vector3 | null {
	return deathLocations.get(player.id) ?? null;
}
