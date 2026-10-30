import {
	type PlayerJoinAfterEvent,
	type PlayerLeaveAfterEvent,
	system,
	world,
} from "@minecraft/server";

const playerNames = new Map<string, string>(); // key is playerId

world.afterEvents.worldLoad.subscribe((): void => {
	for (const p of world.getAllPlayers()) {
		playerNames.set(p.id, p.name);
	}
});

world.afterEvents.playerJoin.subscribe((event: PlayerJoinAfterEvent): void => {
	playerNames.set(event.playerId, event.playerName);
});

world.afterEvents.playerLeave.subscribe((event: PlayerLeaveAfterEvent): void => {
	system.runTimeout(() => {
		playerNames.delete(event.playerId);
	}, 3);
});

export function playerNameTracker(playerId: string): string {
	return playerNames.get(playerId) ?? "UnknownPlayer";
}
