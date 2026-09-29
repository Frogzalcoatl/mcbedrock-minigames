import {
	type Dimension,
	type Entity,
	EntityDamageCause,
	type EntityDamageSource,
	type EntityDieAfterEvent,
	type EntityHurtAfterEvent,
	Player,
	system,
	world,
} from "@minecraft/server";
import { EventSignal } from "../../types";
import { kitEntityDieHandler } from "../game/kits";
import { dimensionTracker } from "./dimensionTracker";

interface HitMapValue {
	lastHitterId: string;
	timestamp: number;
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
	private readonly _hitMap: Map<string, HitMapValue>; // key is entityId

	public constructor(hitCooldownTicks: number) {
		this.hitCooldownTicks = hitCooldownTicks;
		this.dimensions = new Map<string, KillTrackerSettings>();
		this._intervalIds = new Map<string, number>();
		this._hitMap = new Map<string, HitMapValue>();
	}

	public addDimension(dimensionId: string): KillTrackerSettings {
		const settings: KillTrackerSettings = {
			onKill: new EventSignal<EntityDieAfterEvent>(),
			showCombatTime: new EventSignal<Player>(),
			showCombatTimeTickInterval: 0,
		};
		this.dimensions.set(dimensionId, settings);
		return settings;
	}

	private inCombatCondition(timestamp: number): boolean {
		return timestamp >= Date.now() - this.hitCooldownTicks * 50;
	}

	public inCombat(player: Player): boolean {
		const dimension: Dimension | null = dimensionTracker(player);
		if (dimension === null || !this.dimensions.has(dimension.id)) {
			return false;
		}
		const value: HitMapValue | undefined = this._hitMap.get(player.id);
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
		const value: HitMapValue | undefined = this._hitMap.get(player.id);
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
				const settings: KillTrackerSettings | undefined = this.dimensions.get(dimension.id);
				if (settings !== undefined) {
					const event: EntityDieAfterEvent = this.createDeathEvent(
						player,
						EntityDamageCause.override,
					);
					settings.onKill.triggerEvent(event);
				}
			}
		}
		this._hitMap.delete(player.id);
		this.clearInterval(player);
	}

	public combatTimeTicks(player: Player): number {
		const value: HitMapValue | undefined = this._hitMap.get(player.id);
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
		const settings: KillTrackerSettings | undefined = this.dimensions.get(player.dimension.id);
		if (settings === undefined) {
			return;
		}
		system.run(() => {
			if (player.isValid) {
				settings.showCombatTime.triggerEvent(player);
			}
		});
		const intervalId: number = system.runInterval(() => {
			if (!(player.isValid && this.inCombat(player))) {
				this.clearInterval(player);
				return;
			}
		}, settings.showCombatTimeTickInterval);
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
		const settings: KillTrackerSettings | undefined = this.dimensions.get(
			deadPlayer.dimension.id,
		);
		if (settings === undefined) {
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
		settings.onKill.triggerEvent(event);
		kitEntityDieHandler(event);
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
