import {
	type Dimension,
	type Entity,
	EntityComponentTypes,
	EntityDamageCause,
	type EntityDamageSource,
	type EntityDieAfterEvent,
	type EntityHurtAfterEvent,
	type EntityLoadAfterEvent,
	type EntityProjectileComponent,
	type EntityRemoveBeforeEvent,
	type EntitySpawnAfterEvent,
	Player,
	type PlayerDimensionChangeAfterEvent,
	type PlayerJoinAfterEvent,
	type PlayerLeaveAfterEvent,
	type PlayerLeaveBeforeEvent,
	type PlayerSpawnAfterEvent,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import { EventSignal } from "../types";
import { tools } from "./index";

interface KillTrackerValue {
	lastHitterId: string;
	timestamp: number;
}

// Death Location Tracker
// Used to teleport players to death location on respawn
const deathLocations = new Map<string, Vector3>();

world.afterEvents.entityDie.subscribe((event: EntityDieAfterEvent) => {
	if (event.deadEntity instanceof Player === false || !event.deadEntity.isValid) {
		return;
	}
	deathLocations.set(event.deadEntity.id, event.deadEntity.location);
});

world.afterEvents.playerLeave.subscribe((event: PlayerLeaveAfterEvent) => {
	deathLocations.delete(event.playerId);
});

// Dimension Tracker
// Since player.dimension is no longer accessible during PlayerLeaveBeforeEvent
// Use this to get player's dimension on leave and run onLeave callbacks
const playerDimensions = new Map<string, Dimension>();

world.afterEvents.worldLoad.subscribe((): void => {
	for (const p of world.getAllPlayers()) {
		playerDimensions.set(p.id, p.dimension);
	}
});

world.afterEvents.playerSpawn.subscribe((event: PlayerSpawnAfterEvent): void => {
	if (event.initialSpawn) {
		playerDimensions.set(event.player.id, event.player.dimension);
	}
});

world.afterEvents.playerDimensionChange.subscribe(
	(event: PlayerDimensionChangeAfterEvent): void => {
		playerDimensions.set(event.player.id, event.player.dimension);
	},
);

world.afterEvents.playerLeave.subscribe((event: PlayerLeaveAfterEvent): void => {
	system.runTimeout(() => {
		playerDimensions.delete(event.playerId);
	}, 3);
});

// Player Name Tracker
// player.name is no longer accessible during PlayerLeaveBeforeEvent
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

export function deathLocationTracker(player: Player): Vector3 | null {
	return deathLocations.get(player.id) ?? null;
}

export function dimensionTrackerById(playerId: string): Dimension | null {
	return playerDimensions.get(playerId) ?? null;
}

export function dimensionTracker(player: Player): Dimension | null {
	if (player.isValid) {
		return player.dimension;
	} else {
		return playerDimensions.get(player.id) ?? null;
	}
}

export function playerNameTracker(playerId: string): string {
	return playerNames.get(playerId) ?? "UnknownPlayer";
}

export class ProjectileTracker {
	public readonly dimensions: Map<string, string[]>; // values are projectileTypeIds
	private readonly _projectiles: Map<string, string>; // [projectileId, playerId]
	private readonly propertyId: string;

	public constructor() {
		this.dimensions = new Map<string, string[]>();
		this._projectiles = new Map<string, string>();
		this.propertyId = "tracked_projectile";
	}

	public addDimension(dimensionId: string, projectileTypeIds: string[]): void {
		this.dimensions.set(dimensionId, projectileTypeIds);
	}

	public removePlayer(player: Player): void {
		for (const [projectileId, currentPlayerId] of this._projectiles) {
			if (player.id !== currentPlayerId) {
				continue;
			}
			const entity: Entity | undefined = world.getEntity(projectileId);
			if (entity?.isValid) {
				entity.remove();
			}
		}
	}

	private entityRemove = (event: EntityRemoveBeforeEvent): void => {
		this._projectiles.delete(event.removedEntity.id);
	};

	private entitySpawn = (event: EntitySpawnAfterEvent): void => {
		if (!event.entity.isValid) {
			return;
		}
		const projectileTypeIds: string[] | undefined = this.dimensions.get(
			event.entity.dimension.id,
		);
		if (projectileTypeIds === undefined) {
			return;
		}
		const projectileComponent: EntityProjectileComponent | undefined = event.entity.getComponent(
			EntityComponentTypes.Projectile,
		);
		if (projectileComponent?.owner && projectileComponent.owner instanceof Player) {
			this._projectiles.set(event.entity.id, projectileComponent.owner.id);
		}
	};

	private entityLoad = (event: EntityLoadAfterEvent): void => {
		if (event.entity.isValid && event.entity.getDynamicProperty(this.propertyId) !== undefined) {
			event.entity.remove();
		}
	};

	private playerLeave = (event: PlayerLeaveBeforeEvent): void => {
		this.removePlayer(event.player);
	};

	public init(): void {
		world.beforeEvents.entityRemove.subscribe(this.entityRemove);
		world.afterEvents.entitySpawn.subscribe(this.entitySpawn);
		world.afterEvents.entityLoad.subscribe(this.entityLoad);
		world.beforeEvents.playerLeave.subscribe(this.playerLeave);
	}

	public shutdown(): void {
		world.beforeEvents.entityRemove.unsubscribe(this.entityRemove);
		world.afterEvents.entitySpawn.unsubscribe(this.entitySpawn);
		world.afterEvents.entityLoad.unsubscribe(this.entityLoad);
		world.beforeEvents.playerLeave.unsubscribe(this.playerLeave);
	}
}

export interface KillTrackerSettings {
	readonly onKill: EventSignal<EntityDieAfterEvent>;
	readonly showCombatTime: EventSignal<Player>;
	showCombatTimeTickInterval: number;
}

export class KillTracker {
	public hitCooldownTicks: number;
	public readonly dimensions: Map<string, KillTrackerSettings>;
	private readonly _intervalIds: Map<string, number>;
	private readonly _hitMap: Map<string, KillTrackerValue>; // key is entityId

	public constructor(hitCooldownTicks: number) {
		this.hitCooldownTicks = hitCooldownTicks;
		this.dimensions = new Map<string, KillTrackerSettings>();
		this._intervalIds = new Map<string, number>();
		this._hitMap = new Map<string, KillTrackerValue>();
	}

	public addDimension(dimensionId: string): KillTrackerSettings {
		const ktSettings: KillTrackerSettings = {
			onKill: new EventSignal<EntityDieAfterEvent>(),
			showCombatTime: new EventSignal<Player>(),
			showCombatTimeTickInterval: 0,
		};
		this.dimensions.set(dimensionId, ktSettings);
		return ktSettings;
	}

	private inCombatCondition(timestamp: number): boolean {
		return timestamp >= Date.now() - this.hitCooldownTicks * 50;
	}

	public inCombat(player: Player): boolean {
		const dimension: Dimension | null = dimensionTracker(player);
		if (dimension === null || !this.dimensions.has(dimension.id)) {
			return false;
		}
		const value: KillTrackerValue | undefined = this._hitMap.get(player.id);
		if (value === undefined) {
			return false;
		}
		return this.inCombatCondition(value.timestamp);
	}

	public setCombat(hurtPlayer: Player, damagingEntity: Entity): void {
		if (!this.dimensions.has(hurtPlayer.dimension.id)) {
			return;
		}
		this._hitMap.set(hurtPlayer.id, {
			lastHitterId: damagingEntity.id,
			timestamp: Date.now(),
		});
		this.showCombatTime(hurtPlayer);
		if (damagingEntity instanceof Player) {
			this._hitMap.set(damagingEntity.id, {
				lastHitterId: hurtPlayer.id,
				timestamp: Date.now(),
			});
			this.showCombatTime(damagingEntity);
		}
	}

	public getLastHitter(player: Player): Entity | null {
		const dimension: Dimension | null = dimensionTracker(player);
		if (dimension === null || !this.dimensions.has(dimension.id)) {
			return null;
		}
		const value: KillTrackerValue | undefined = this._hitMap.get(player.id);
		if (value === undefined) {
			return null;
		}
		if (!this.inCombatCondition(value.timestamp)) {
			return null;
		}
		const lastHitter = world.getEntity(value.lastHitterId);
		if (lastHitter === undefined || !lastHitter.isValid) {
			return null;
		}
		return lastHitter;
	}

	public removePlayer(player: Player): void {
		if (this.inCombat(player)) {
			const dimension: Dimension | null = dimensionTracker(player);
			if (dimension !== null) {
				const ktSettings: KillTrackerSettings | undefined = this.dimensions.get(dimension.id);
				if (ktSettings !== undefined) {
					const event: EntityDieAfterEvent = this.createDeathEvent(
						player,
						EntityDamageCause.override,
					);
					ktSettings.onKill.triggerEvent(event);
				}
			}
		}
		this._hitMap.delete(player.id);
		this.clearInterval(player);
	}

	public combatTimeTicks(player: Player): number {
		const value: KillTrackerValue | undefined = this._hitMap.get(player.id);
		if (value === undefined) {
			return -1;
		}
		const now: number = Date.now();
		if (value.timestamp < now - this.hitCooldownTicks * 50) {
			return -1;
		}
		return (value.timestamp - now) / 50 + this.hitCooldownTicks;
	}

	private createDeathEvent(deadPlayer: Player, cause: EntityDamageCause): EntityDieAfterEvent {
		const lastHitter: Entity | null = this.getLastHitter(deadPlayer);
		let source: EntityDamageSource;
		if (lastHitter !== null) {
			source = {
				cause: cause,
				damagingEntity: lastHitter,
			};
		} else {
			source = {
				cause: cause,
			};
		}
		return {
			damageSource: source,
			deadEntity: deadPlayer,
		};
	}

	private clearInterval(player: Player): void {
		const id: number | undefined = this._intervalIds.get(player.id);
		if (id !== undefined) {
			system.clearRun(id);
			this._intervalIds.delete(player.id);
		}
	}

	private showCombatTime(player: Player): void {
		this.clearInterval(player);
		const ktSettings: KillTrackerSettings | undefined = this.dimensions.get(player.dimension.id);
		if (ktSettings === undefined) {
			return;
		}
		system.run(() => {
			if (player.isValid) {
				ktSettings.showCombatTime.triggerEvent(player);
			}
		});
		const intervalId: number = system.runInterval(() => {
			if (!(player.isValid && this.inCombat(player))) {
				this.clearInterval(player);
				return;
			}
		}, ktSettings.showCombatTimeTickInterval);
		this._intervalIds.set(player.id, intervalId);
	}

	private enitityHurt = (event: EntityHurtAfterEvent): void => {
		if (event.damageSource.damagingEntity !== undefined && event.hurtEntity instanceof Player) {
			this.setCombat(event.hurtEntity, event.damageSource.damagingEntity);
		}
	};

	private entityDie = (event: EntityDieAfterEvent): void => {
		if (!event.deadEntity.isValid || event.deadEntity instanceof Player === false) {
			return;
		}
		const deadPlayer: Player = event.deadEntity;
		const ktSettings: KillTrackerSettings | undefined = this.dimensions.get(
			deadPlayer.dimension.id,
		);
		if (ktSettings === undefined) {
			return;
		}
		if (event.damageSource.damagingEntity === undefined) {
			// I have to create a new event because im not able to reassign event.damageSource.damagingEntity for some reason.
			event = this.createDeathEvent(deadPlayer, event.damageSource.cause);
		}
		this._hitMap.delete(event.deadEntity.id);
		if (event.damageSource.damagingEntity !== undefined) {
			this._hitMap.delete(event.damageSource.damagingEntity.id);
		}
		ktSettings.onKill.triggerEvent(event);
		tools.kitManager.entityDie(event);
	};

	public init(): void {
		world.afterEvents.entityHurt.subscribe(this.enitityHurt);
		world.afterEvents.entityDie.subscribe(this.entityDie);
	}

	public shutdown(): void {
		world.afterEvents.entityHurt.unsubscribe(this.enitityHurt);
		world.afterEvents.entityDie.unsubscribe(this.entityDie);
	}
}
