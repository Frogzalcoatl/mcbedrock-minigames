import {
	type Dimension,
	type PlayerDimensionChangeAfterEvent,
	type PlayerLeaveAfterEvent,
	type PlayerSpawnAfterEvent,
	system,
	world,
} from "@minecraft/server";

// Since player.dimension is no longer accessible during PlayerLeaveBeforeEvent
// Use this to get player's dimension on leave and run onLeave callbacks

const dimensions = new Map<string, Dimension>();

world.afterEvents.worldLoad.subscribe((): void => {
	for (const p of world.getAllPlayers()) {
		dimensions.set(p.id, p.dimension);
	}
});

world.afterEvents.playerSpawn.subscribe((event: PlayerSpawnAfterEvent): void => {
	if (event.initialSpawn) {
		dimensions.set(event.player.id, event.player.dimension);
	}
});

world.afterEvents.playerDimensionChange.subscribe(
	(event: PlayerDimensionChangeAfterEvent): void => {
		dimensions.set(event.player.id, event.player.dimension);
	},
);

world.afterEvents.playerLeave.subscribe((event: PlayerLeaveAfterEvent): void => {
	system.runTimeout(() => {
		dimensions.delete(event.playerId);
	}, 3);
});

export function dimensionTracker(playerId: string): Dimension | null {
	return dimensions.get(playerId) ?? null;
}
