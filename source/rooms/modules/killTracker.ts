import { type Entity, type EntityDieAfterEvent, Player, world } from "@minecraft/server";

export interface KillTracker {
	map: Map<string, [string, number]>; // [playerId, [hitterId, timestamp (Date.now())]]
	onKill: ((event: EntityDieAfterEvent) => void) | null; // dimensionId is validated before running
	cooldownTicks: number;
	includeMobKills: boolean;
}

export interface KillTrackerConfig {
	cooldownTicks: number;
	includeMobKills: boolean;
	onKill?: (event: EntityDieAfterEvent) => void;
}

function getLastHitter(deadEntity: Entity, tracker: KillTracker): Entity | null {
	const entry = tracker.map.get(deadEntity.id);
	if (entry === undefined) {
		return null;
	}
	const [lastHitterId, timestamp] = entry;
	if (timestamp > Date.now() + tracker.cooldownTicks * 50) {
		return null;
	}
	const lastHitter = world.getEntity(lastHitterId);
	if (lastHitter === undefined || !lastHitter.isValid) {
		return null;
	}
	return lastHitter;
}

export function getKillTracker(
	dimensionId: string,
	onKill: ((event: EntityDieAfterEvent) => void) | null,
	cooldownTicks: number,
	includeMobKills: boolean,
): KillTracker {
	const tracker: KillTracker = {
		cooldownTicks: cooldownTicks,
		includeMobKills: includeMobKills,
		map: new Map<string, [string, number]>(),
		onKill: onKill,
	};
	world.afterEvents.entityHurt.subscribe((event) => {
		if (
			event.hurtEntity.dimension.id !== dimensionId ||
			(event.damageSource.damagingEntity?.isValid &&
				event.damageSource.damagingEntity.dimension.id !== dimensionId)
		) {
			return;
		}
		if (
			event.hurtEntity instanceof Player &&
			event.damageSource.damagingEntity instanceof Player
		) {
			tracker.map.set(event.hurtEntity.id, [
				event.damageSource.damagingEntity.id,
				Date.now(),
			]);
		} else {
			tracker.map.delete(event.hurtEntity.id);
		}
	});
	world.afterEvents.entityDie.subscribe((event) => {
		if (
			event.deadEntity.dimension.id !== dimensionId ||
			(event.damageSource.damagingEntity?.isValid &&
				event.damageSource.damagingEntity.dimension.id !== dimensionId) ||
			(!tracker.includeMobKills && event.deadEntity instanceof Player === false)
		) {
			return;
		}
		if (event.damageSource.damagingEntity === undefined) {
			const lastHitter = getLastHitter(event.deadEntity, tracker);
			if (lastHitter !== null) {
				event.damageSource.damagingEntity = lastHitter;
			}
		}
		if (tracker.onKill !== null) {
			tracker.onKill(event);
		}
	});
	return tracker;
}
