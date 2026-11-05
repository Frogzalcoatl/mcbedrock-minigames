import {
	type EntityDieAfterEvent,
	Player,
	type PlayerLeaveAfterEvent,
	world,
} from "@minecraft/server";

const deathTimes = new Map<string, number>();

world.afterEvents.entityDie.subscribe((event: EntityDieAfterEvent): void => {
	if (event.deadEntity instanceof Player === false || !event.deadEntity.isValid) {
		return;
	}
	deathTimes.set(event.deadEntity.id, Date.now());
});

world.afterEvents.playerLeave.subscribe((event: PlayerLeaveAfterEvent): void => {
	deathTimes.delete(event.playerId);
});

export function ticksSinceDeath(player: Player): number | undefined {
	const timestamp: number | undefined = deathTimes.get(player.id);
	if (timestamp === undefined) {
		return undefined;
	}
	return Math.floor((Date.now() - timestamp) / 50);
}
