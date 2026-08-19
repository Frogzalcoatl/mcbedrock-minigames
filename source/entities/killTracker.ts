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
	showCombatTimeTickInterval?: number;
}

const configs = new Map<string, KillTrackerConfig>(); // [dimensionId, config]
const hitMap = new Map<string, [string, number]>(); // [entityId, [hitterId, timestamp (Date.now())]]
const showTimeMap = new Map<string, number>(); //// [playerId, runIntervalId]

export function killTrackerAddDimension(dimensionId: string, config: KillTrackerConfig): void {
	configs.set(dimensionId, config);
}

export function killTrackerRemoveDimension(dimensionId: string): boolean {
	return configs.delete(dimensionId);
}

export function killTrackerHasDimension(dimensionId: string): boolean {
	return configs.has(dimensionId);
}

export function killTrackerClearDimensions(): void {
	configs.clear();
}

// true when in combat
function inCombatCondition(timestamp: number): boolean {
	return timestamp >= Date.now() - hitCooldownTicks * 50;
}

export function killTrackerInCombat(player: Player): boolean {
	if (!configs.has(player.dimension.id)) {
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
	if (!configs.has(player.dimension.id)) {
		return null;
	}
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
	if (lastHitter !== null) {
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
	const intervalId: number | undefined = showTimeMap.get(player.id);
	if (intervalId !== undefined) {
		system.clearRun(intervalId);
		showTimeMap.delete(player.id);
	}
}

function showCombatTime(player: Player): void {
	clearCombatTimeRunInterval(player);
	const config: KillTrackerConfig | undefined = configs.get(player.dimension.id);
	if (config === undefined || config.showCombatTime === null) {
		return;
	}
	system.run(() => {
		if (config.showCombatTime !== null) {
			config.showCombatTime(player);
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
	}, config.showCombatTimeTickInterval ?? 0);
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
		const config: KillTrackerConfig | undefined = configs.get(player.dimension.id);
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
	if (!configs.has(hurtPlayer.dimension.id)) {
		return;
	}
	hitMap.set(hurtPlayer.id, [damagingEntity.id, Date.now()]);
	showCombatTime(event.hurtEntity);
	if (event.damageSource.damagingEntity instanceof Player) {
		hitMap.set(damagingEntity.id, [hurtPlayer.id, Date.now()]);
		showCombatTime(event.damageSource.damagingEntity);
	}
}

function entityDie(event: EntityDieAfterEvent): void {
	if (!event.deadEntity.isValid || event.deadEntity instanceof Player === false) {
		return;
	}
	const deadPlayer: Player = event.deadEntity;
	const config: KillTrackerConfig | undefined = configs.get(deadPlayer.dimension.id);
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
