import {
	type Entity,
	EntityDamageCause,
	type EntityDieAfterEvent,
	type EntityHurtAfterEvent,
	Player,
	type PlayerSpawnAfterEvent,
	system,
	world,
} from "@minecraft/server";
import { EventSignal } from "../shared/eventSignal";

interface KillTrackerValue {
	lastHitterId: string;
	timestamp: number;
}

export interface CombatKillEvent {
	cause?: EntityDamageCause;
	deadPlayer: Player;
	killer?: Entity | undefined;
}

export class KillTracker {
	public hitCooldownTicks: number;
	public readonly onKill: EventSignal<CombatKillEvent>;
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

	public getLastHitter(player: Player): Entity | undefined {
		const value: KillTrackerValue | undefined = this._hitMap.get(player.id);
		if (value === undefined) {
			return undefined;
		}
		if (!this.inCombatCondition(value.timestamp)) {
			return undefined;
		}
		const lastHitter = world.getEntity(value.lastHitterId);
		if (lastHitter === undefined || !lastHitter.isValid) {
			return undefined;
		}
		return lastHitter;
	}

	public removePlayer(playerId: string): void {
		const playerEntity: Entity | undefined = world.getEntity(playerId);
		if (playerEntity !== undefined && playerEntity instanceof Player) {
			this.onKill.triggerEvent({
				cause: EntityDamageCause.override,
				deadPlayer: playerEntity,
				killer: this.getLastHitter(playerEntity),
			});
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
		const combatEvent: CombatKillEvent = {
			cause: event.damageSource.cause,
			deadPlayer: event.deadEntity,
			killer: event.damageSource.damagingEntity ?? this.getLastHitter(event.deadEntity),
		};
		this._hitMap.delete(event.deadEntity.id);
		if (event.damageSource.damagingEntity !== undefined) {
			this._hitMap.delete(event.damageSource.damagingEntity.id);
		}
		this.onKill.triggerEvent(combatEvent);
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
