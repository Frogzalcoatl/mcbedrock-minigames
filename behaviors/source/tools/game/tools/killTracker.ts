import {
	type Entity,
	EntityDamageCause,
	type EntityDamageSource,
	type EntityDieAfterEvent,
	type EntityHurtAfterEvent,
	Player,
	type PlayerSpawnAfterEvent,
	system,
	world,
} from "@minecraft/server";
import { tools } from "../..";
import { EventSignal } from "../../types";

interface KillTrackerValue {
	lastHitterId: string;
	timestamp: number;
}

export class KillTracker {
	public hitCooldownTicks: number;
	public readonly onKill: EventSignal<EntityDieAfterEvent>;
	public readonly onRespawn: EventSignal<Player>;
	public readonly showCombatTime: EventSignal<Player>;
	public showCombatTimeTickInterval: number;
	private readonly _intervalIds: Map<string, number>;
	private readonly _hitMap: Map<string, KillTrackerValue>; // key is entityId

	public constructor(hitCooldownTicks: number) {
		this.hitCooldownTicks = hitCooldownTicks;
		this.onKill = new EventSignal();
		this.onRespawn = new EventSignal();
		this.showCombatTime = new EventSignal();
		this.showCombatTimeTickInterval = 0;
		this._intervalIds = new Map<string, number>();
		this._hitMap = new Map<string, KillTrackerValue>();
	}

	private inCombatCondition(timestamp: number): boolean {
		return timestamp >= Date.now() - this.hitCooldownTicks * 50;
	}

	public inCombat(playerId: string): boolean {
		const value: KillTrackerValue | undefined = this._hitMap.get(playerId);
		if (value === undefined) {
			return false;
		}
		return this.inCombatCondition(value.timestamp);
	}

	public setCombat(hurtPlayer: Player, damagingEntity: Entity): void {
		this._hitMap.set(hurtPlayer.id, {
			lastHitterId: damagingEntity.id,
			timestamp: Date.now(),
		});
		this.runShowCombatTime(hurtPlayer);
		if (damagingEntity instanceof Player) {
			this._hitMap.set(damagingEntity.id, {
				lastHitterId: hurtPlayer.id,
				timestamp: Date.now(),
			});
			this.runShowCombatTime(damagingEntity);
		}
	}

	public getLastHitter(player: Player): Entity | null {
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

	public removePlayer(playerId: string): void {
		const playerEntity: Entity | undefined = world.getEntity(playerId);
		if (playerEntity !== undefined && playerEntity instanceof Player && this.inCombat(playerId)) {
			const event: EntityDieAfterEvent = this.createDeathEvent(
				playerEntity,
				this.getLastHitter(playerEntity),
				EntityDamageCause.override,
			);
			this.onKill.triggerEvent(event);
		}
		this._hitMap.delete(playerId);
		this.clearInterval(playerId);
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

	private createDeathEvent(
		deadPlayer: Player,
		lastHitter: Entity | null,
		cause: EntityDamageCause,
	): EntityDieAfterEvent {
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

	private clearInterval(playerId: string): void {
		const id: number | undefined = this._intervalIds.get(playerId);
		if (id !== undefined) {
			system.clearRun(id);
			this._intervalIds.delete(playerId);
		}
	}

	private runShowCombatTime(player: Player): void {
		this.clearInterval(player.id);
		system.run(() => {
			if (player.isValid) {
				this.showCombatTime.triggerEvent(player);
			}
		});
		const intervalId: number = system.runInterval(() => {
			if (!(player.isValid && this.inCombat(player.id))) {
				this.clearInterval(player.id);
				return;
			}
		}, this.showCombatTimeTickInterval);
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
		if (event.damageSource.damagingEntity === undefined) {
			// I have to create a new event because im not able to reassign event.damageSource.damagingEntity for some reason.
			event = this.createDeathEvent(
				deadPlayer,
				this.getLastHitter(event.deadEntity),
				event.damageSource.cause,
			);
		}
		this._hitMap.delete(event.deadEntity.id);
		if (event.damageSource.damagingEntity !== undefined) {
			this._hitMap.delete(event.damageSource.damagingEntity.id);
		}
		this.onKill.triggerEvent(event);
		tools.kitManager.entityDie(event);
	};

	private playerSpawn = (event: PlayerSpawnAfterEvent): void => {
		if (event.initialSpawn || !event.player.isValid) {
			return;
		}
		this.onRespawn.triggerEvent(event.player);
	};

	public init(): void {
		world.afterEvents.entityHurt.subscribe(this.enitityHurt);
		world.afterEvents.entityDie.subscribe(this.entityDie);
		world.afterEvents.playerSpawn.subscribe(this.playerSpawn);
	}

	public shutdown(): void {
		world.afterEvents.entityHurt.unsubscribe(this.enitityHurt);
		world.afterEvents.entityDie.unsubscribe(this.entityDie);
		world.afterEvents.playerSpawn.unsubscribe(this.playerSpawn);
	}
}
