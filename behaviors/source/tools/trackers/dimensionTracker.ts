import {
	type Dimension,
	type PlayerDimensionChangeAfterEvent,
	type PlayerLeaveAfterEvent,
	system,
	world,
} from "@minecraft/server";

// Since player.dimension is no longer accessible during PlayerLeaveBeforeEvent
// Use this to get player's dimension on leave and run onLeave callbacks

const dimensions = new Map<string, Dimension>();

world.afterEvents.playerDimensionChange.subscribe((event: PlayerDimensionChangeAfterEvent) => {
	dimensions.set(event.player.id, event.player.dimension);
});

world.afterEvents.playerLeave.subscribe((event: PlayerLeaveAfterEvent) => {
	system.runTimeout(() => {
		dimensions.delete(event.playerId);
	}, 3);
});

export function dimensionTracker(playerId: string): Dimension | null {
	return dimensions.get(playerId) ?? null;
}
