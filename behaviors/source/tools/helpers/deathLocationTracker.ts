import {
	type Dimension,
	type EntityDieAfterEvent,
	Player,
	type PlayerLeaveAfterEvent,
	type Vector3,
	world,
} from "@minecraft/server";

const deathLocations = new Map<string, DeathLocation>();

function entityDie(event: EntityDieAfterEvent): void {
	if (event.deadEntity instanceof Player === false || !event.deadEntity.isValid) {
		return;
	}
	deathLocations.set(event.deadEntity.id, {
		dimension: event.deadEntity.dimension,
		pos: event.deadEntity.location,
	});
}

function playerLeave(event: PlayerLeaveAfterEvent): void {
	deathLocations.delete(event.playerId);
}

let isInitialized = false;

export interface DeathLocation {
	dimension: Dimension;
	pos: Vector3;
}

export function initDeathLocationTracker(): void {
	if (!isInitialized) {
		world.afterEvents.entityDie.subscribe(entityDie);
		world.afterEvents.playerLeave.subscribe(playerLeave);
		isInitialized = true;
	}
}

export function shutdownDeathLocationTracker(): void {
	if (isInitialized) {
		world.afterEvents.entityDie.unsubscribe(entityDie);
		world.afterEvents.playerLeave.unsubscribe(playerLeave);
		isInitialized = false;
	}
}

export function getLastDeathLocation(player: Player): DeathLocation | undefined {
	return deathLocations.get(player.id);
}
