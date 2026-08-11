import {
	type Entity,
	EntityDamageCause,
	type EntityDamageSource,
	type EntityDieAfterEvent,
	type EntityHurtAfterEvent,
	Player,
	system,
	world,
} from "@minecraft/server";

const hitCooldownTicks: number = 20 * 7;

export interface KillTrackerConfig {
	onKill: ((event: EntityDieAfterEvent) => void) | null;
	showCombatTime: ((player: Player) => void) | null;
	combatTimeTickInterval?: number;
}

export const killTrackerDimensionConfigs = new Map<string, KillTrackerConfig>(); // [dimensionId, config]
const hitMap = new Map<string, [string, number]>(); // [entityId, [hitterId, timestamp (Date.now())]]
const showTimeMap = new Map<string, number>(); //// [playerId, system.runInterval runId]

// true when in combat
function inCombatCondition(timestamp: number): boolean {
	return timestamp >= Date.now() - hitCooldownTicks * 50;
}

export function killTrackerInCombat(player: Player): boolean {
	if (!killTrackerDimensionConfigs.has(player.dimension.id)) {
		return false;
	}
	const entry = hitMap.get(player.id);
	if (entry === undefined) {
		return false;
	}
	const [, timestamp] = entry;
	return inCombatCondition(timestamp);
}

export function killTrackerGetLastHitter(player: Player): Entity | null {
	const entry = hitMap.get(player.id);
	if (entry === undefined) {
		return null;
	}
	const [lastHitterId, timestamp] = entry;
	if (!inCombatCondition(timestamp)) {
		hitMap.delete(player.id);
		return null;
	}
	const lastHitter = world.getEntity(lastHitterId);
	if (lastHitter === undefined || !lastHitter.isValid) {
		return null;
	}
	return lastHitter;
}

function createDeathEvent(player: Player): EntityDieAfterEvent {
	const lastHitter: Entity | null = killTrackerGetLastHitter(player);
	let source: EntityDamageSource;
	if (lastHitter?.isValid) {
		source = {
			cause: EntityDamageCause.override,
			damagingEntity: lastHitter,
		};
	} else {
		source = {
			cause: EntityDamageCause.override,
		};
	}
	return {
		damageSource: source,
		deadEntity: player,
	};
}

function clearCombatTimeRunInterval(player: Player): void {
	const runId: number | undefined = showTimeMap.get(player.id);
	if (runId !== undefined) {
		system.clearRun(runId);
		showTimeMap.delete(player.id);
	}
}

function showCombatTime(player: Player): void {
	clearCombatTimeRunInterval(player);
	const config: KillTrackerConfig | undefined = killTrackerDimensionConfigs.get(player.id);
	if (config === undefined || config.showCombatTime === null) {
		return;
	}
	system.run(() => {
		if (config.showCombatTime !== null) {
			showCombatTime(player);
		}
	});
	const intervalId: number = system.runInterval(() => {
		if (!(player.isValid && killTrackerInCombat(player))) {
			clearCombatTimeRunInterval(player);
			return;
		}
		if (config.showCombatTime !== null) {
			config.showCombatTime(player);
		}
	}, config.combatTimeTickInterval ?? 0);
	showTimeMap.set(player.id, intervalId);
}

export function killTrackerGetCombatTimeTicks(player: Player): number {
	const entry = hitMap.get(player.id);
	if (entry === undefined) {
		return -1;
	}
	const [, timestamp] = entry;
	const now: number = Date.now();
	if (timestamp < now - hitCooldownTicks * 50) {
		return -1;
	}
	return (timestamp - now) / 50 + hitCooldownTicks;
}

export function killTrackerRemovePlayer(player: Player): void {
	if (killTrackerInCombat(player)) {
		const config: KillTrackerConfig | undefined = killTrackerDimensionConfigs.get(
			player.dimension.id,
		);
		if (config !== undefined && config.onKill !== null) {
			const event: EntityDieAfterEvent = createDeathEvent(player);
			config.onKill(event);
		}
	}
	hitMap.delete(player.id);
	clearCombatTimeRunInterval(player);
}

function entityHurt(event: EntityHurtAfterEvent): void {
	if (
		event.damageSource.damagingEntity === undefined ||
		event.hurtEntity instanceof Player === false
	) {
		return;
	}
	const hurtPlayer: Player = event.hurtEntity;
	const damagingEntity: Entity = event.damageSource.damagingEntity;
	if (!killTrackerDimensionConfigs.has(hurtPlayer.dimension.id)) {
		return;
	}
	hitMap.set(hurtPlayer.id, [damagingEntity.id, Date.now()]);
	showCombatTime(event.hurtEntity);
	if (event.damageSource.damagingEntity instanceof Player) {
		hitMap.set(damagingEntity.id, [hurtPlayer.id, Date.now()]);
		showCombatTime(event.hurtEntity);
	}
}

function entityDie(event: EntityDieAfterEvent): void {
	if (!event.deadEntity.isValid || event.deadEntity instanceof Player === false) {
		return;
	}
	const deadPlayer: Player = event.deadEntity;
	const config: KillTrackerConfig | undefined = killTrackerDimensionConfigs.get(
		deadPlayer.dimension.id,
	);
	if (config === undefined) {
		return;
	}
	if (event.damageSource.damagingEntity === undefined) {
		const lastHitter: Entity | null = killTrackerGetLastHitter(deadPlayer);
		if (lastHitter !== null) {
			event.damageSource.damagingEntity = lastHitter;
		}
	}
	const damagingEntity: Entity | undefined = event.damageSource.damagingEntity;
	hitMap.delete(deadPlayer.id);
	if (damagingEntity !== undefined) {
		hitMap.delete(damagingEntity.id);
	}
	if (config.onKill !== null) {
		config.onKill(event);
	}
}

world.afterEvents.entityHurt.subscribe(entityHurt);
world.afterEvents.entityDie.subscribe(entityDie);
