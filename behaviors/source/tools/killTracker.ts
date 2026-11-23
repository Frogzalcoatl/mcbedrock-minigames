import {
	type Entity,
	EntityDamageCause,
	type EntityDieAfterEvent,
	type EntityHurtAfterEvent,
	Player,
	type PlayerLeaveAfterEvent,
	system,
	world,
} from "@minecraft/server";
import { EventSignal } from "./shared/eventSignal";

interface KillTrackerValue {
	expireTick: number;
	hitterId: string;
	timeoutId: number;
}

export interface KillTrackerDeathEvent {
	cause: EntityDamageCause;
	deadPlayerId: string;
	deadPlayerName: string;
	killerId?: string;
}

export interface HitterSetEvent {
	hitter: Entity;
	player: Player;
}

export interface HitterClearEvent {
	oldHitterId: string;
	playerId: string;
}

export class KillTracker {
	public hitCooldownTicks: number;
	public readonly onDeath: EventSignal<KillTrackerDeathEvent>;
	public readonly onHitterSet: EventSignal<HitterSetEvent>;
	public readonly onHitterClear: EventSignal<HitterClearEvent>;
	private readonly _hitMap: Map<string, KillTrackerValue>; // key is entityId
	public deathEventOnDisconnect: boolean;
	private _isInitialized: boolean;

	public constructor(hitCooldownTicks: number) {
		this.hitCooldownTicks = hitCooldownTicks;
		this.onDeath = new EventSignal();
		this.onHitterSet = new EventSignal();
		this.onHitterClear = new EventSignal();
		this._hitMap = new Map();
		this.deathEventOnDisconnect = true;
		this._isInitialized = false;
	}

	public hasValidHitter(playerId: string): boolean {
		const value: KillTrackerValue | undefined = this._hitMap.get(playerId);
		if (value === undefined) {
			return false;
		}
		return system.currentTick < value.expireTick;
	}

	public hitterTicksRemaining(playerId: string): number {
		const value = this._hitMap.get(playerId);
		if (!value) {
			return 0;
		}
		return Math.max(0, value.expireTick - system.currentTick);
	}

	public getHitter(playerId: string): Entity | undefined {
		const value = this._hitMap.get(playerId);
		if (value === undefined || system.currentTick >= value.expireTick) {
			return undefined;
		}
		const hitter: Entity | undefined = world.getEntity(value.hitterId);
		return hitter?.isValid ? hitter : undefined;
	}

	private onTimeoutExpire(playerId: string, expectedExpireTick: number): void {
		const value = this._hitMap.get(playerId);
		if (value === undefined || value.expireTick !== expectedExpireTick) {
			return;
		}
		this._hitMap.delete(playerId);
		this.onHitterClear.triggerEvent({
			oldHitterId: value.hitterId,
			playerId,
		});
	}

	public setHitter(player: Player, hitter: Entity): void {
		const oldValue = this._hitMap.get(player.id);
		if (oldValue !== undefined) {
			system.clearRun(oldValue.timeoutId);
			if (system.currentTick < oldValue.expireTick && oldValue.hitterId !== hitter.id) {
				this.onHitterClear.triggerEvent({
					oldHitterId: oldValue.hitterId,
					playerId: player.id,
				});
			}
		}
		const expireTick: number = system.currentTick + this.hitCooldownTicks;
		this._hitMap.set(player.id, {
			expireTick: expireTick,
			hitterId: hitter.id,
			timeoutId: system.runTimeout(
				() => this.onTimeoutExpire(player.id, expireTick),
				this.hitCooldownTicks,
			),
		});
		this.onHitterSet.triggerEvent({ hitter: hitter, player: player });
	}

	public clearAll(): void {
		for (const value of this._hitMap.values()) {
			system.clearRun(value.timeoutId);
		}
		this._hitMap.clear();
	}

	public clearHitter(player: Player, triggerDeathEvent: boolean): void {
		this.handleHitterClear(player.id, player.name, triggerDeathEvent);
	}

	private handleHitterClear(
		playerId: string,
		playerName: string,
		triggerDeathEvent: boolean,
	): void {
		const oldValue = this._hitMap.get(playerId);
		if (oldValue !== undefined) {
			system.clearRun(oldValue.timeoutId);
			this._hitMap.delete(playerId);
			if (system.currentTick < oldValue.expireTick) {
				this.onHitterClear.triggerEvent({ oldHitterId: oldValue.hitterId, playerId: playerId });
			}
		}
		if (triggerDeathEvent) {
			const deathEvent: KillTrackerDeathEvent = {
				cause: EntityDamageCause.override,
				deadPlayerId: playerId,
				deadPlayerName: playerName,
			};
			if (oldValue !== undefined && system.currentTick < oldValue.expireTick) {
				deathEvent.killerId = oldValue.hitterId;
			}
			this.onDeath.triggerEvent(deathEvent);
		}
	}

	private playerLeave = (event: PlayerLeaveAfterEvent): void => {
		this.handleHitterClear(event.playerId, event.playerName, this.deathEventOnDisconnect);
	};

	private entityHurt = (event: EntityHurtAfterEvent): void => {
		if (event.damageSource.damagingEntity?.isValid && event.hurtEntity instanceof Player) {
			this.setHitter(event.hurtEntity, event.damageSource.damagingEntity);
		}
	};

	private entityDie = (event: EntityDieAfterEvent): void => {
		if (!event.deadEntity.isValid || event.deadEntity instanceof Player === false) {
			return;
		}
		let lastHitterId: string | undefined;
		const value = this._hitMap.get(event.deadEntity.id);
		if (value !== undefined) {
			if (system.currentTick < value.expireTick) {
				lastHitterId = value.hitterId;
			}
			system.clearRun(value.timeoutId);
			this._hitMap.delete(event.deadEntity.id);
		}
		if (lastHitterId !== undefined) {
			this.onHitterClear.triggerEvent({
				oldHitterId: lastHitterId,
				playerId: event.deadEntity.id,
			});
		}
		const deathEvent: KillTrackerDeathEvent = {
			cause: event.damageSource.cause,
			deadPlayerId: event.deadEntity.id,
			deadPlayerName: event.deadEntity.name,
		};
		if (event.damageSource.damagingEntity !== undefined) {
			deathEvent.killerId = event.damageSource.damagingEntity.id;
		} else if (lastHitterId !== undefined) {
			deathEvent.killerId = lastHitterId;
		}
		this.onDeath.triggerEvent(deathEvent);
	};

	public init(): void {
		if (!this._isInitialized) {
			world.afterEvents.playerLeave.subscribe(this.playerLeave);
			world.afterEvents.entityHurt.subscribe(this.entityHurt);
			world.afterEvents.entityDie.subscribe(this.entityDie);
			this._isInitialized = true;
		}
	}

	public shutdown(): void {
		if (this._isInitialized) {
			world.afterEvents.playerLeave.unsubscribe(this.playerLeave);
			world.afterEvents.entityHurt.unsubscribe(this.entityHurt);
			world.afterEvents.entityDie.unsubscribe(this.entityDie);
			this.clearAll();
			this._isInitialized = false;
		}
	}
}
