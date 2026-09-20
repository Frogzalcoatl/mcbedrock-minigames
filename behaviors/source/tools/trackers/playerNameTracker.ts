import {
	type PlayerJoinAfterEvent,
	type PlayerLeaveAfterEvent,
	system,
	world,
} from "@minecraft/server";

// player.name is no longer accessible during PlayerLeaveBeforeEvent

const names = new Map<string, string>(); // key is playerId

world.afterEvents.worldLoad.subscribe((): void => {
	for (const p of world.getAllPlayers()) {
		names.set(p.id, p.name);
	}
});

world.afterEvents.playerJoin.subscribe((event: PlayerJoinAfterEvent): void => {
	names.set(event.playerId, event.playerName);
});

world.afterEvents.playerLeave.subscribe((event: PlayerLeaveAfterEvent): void => {
	system.runTimeout(() => {
		names.delete(event.playerId);
	}, 3);
});

export function playerNameTracker(playerId: string): string {
	return names.get(playerId) ?? "UnknownPlayer";
}
