import {
	type EntityDieAfterEvent,
	Player,
	type PlayerLeaveAfterEvent,
	type Vector3,
	world,
} from "@minecraft/server";

// Tool used to teleport players to death location on respawn

const locations = new Map<string, Vector3>();

world.afterEvents.entityDie.subscribe((event: EntityDieAfterEvent) => {
	if (event.deadEntity instanceof Player === false || !event.deadEntity.isValid) {
		return;
	}
	locations.set(event.deadEntity.id, event.deadEntity.location);
});

world.afterEvents.playerLeave.subscribe((event: PlayerLeaveAfterEvent) => {
	locations.delete(event.playerId);
});

export function deathLocationTracker(player: Player): Vector3 | null {
	return locations.get(player.id) ?? null;
}
