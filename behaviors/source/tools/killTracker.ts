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
	lastHitterId: string;
}

export interface KillTrackerEvent {
	cause?: EntityDamageCause;
	deadPlayer: Player;
	killer?: Entity | undefined;
}

export interface CombatEnterEvent {
	opponent?: Entity;
	player: Player;
}

export class KillTracker {
	public combatDurationTicks: number;
	public readonly onKill: EventSignal<KillTrackerEvent>;
	public readonly onCombatEnter: EventSignal<CombatEnterEvent>;
	public readonly onCombatExit: EventSignal<Player>;
	private readonly _combatMap: Map<string, KillTrackerValue>; // key is entityId
	private _isInitialized: boolean;

	public constructor(hitCooldownTicks: number) {
		this.combatDurationTicks = hitCooldownTicks;
		this.onKill = new EventSignal();
		this.onCombatEnter = new EventSignal();
		this.onCombatExit = new EventSignal();
		this._combatMap = new Map();
		this._isInitialized = false;
	}

	public inCombat(playerId: string): boolean {
		const value: KillTrackerValue | undefined = this._combatMap.get(playerId);
		if (value === undefined) {
			return false;
		}
		return system.currentTick < value.expireTick;
	}

	public getRemainingCombatTicks(playerId: string): number {
		const value = this._combatMap.get(playerId);
		if (!value) {
			return 0;
		}
		return Math.max(0, value.expireTick - system.currentTick);
	}

	public getLastHitter(player: Player): Entity | undefined {
		const value = this._combatMap.get(player.id);
		if (!value || system.currentTick >= value.expireTick) {
			return undefined;
		}
		const hitter: Entity | undefined = world.getEntity(value.lastHitterId);
		return hitter?.isValid ? hitter : undefined;
	}

	public setCombat(hurtPlayer: Player, damagingEntity: Entity): void {
		this.applyTag(hurtPlayer, damagingEntity);
		if (damagingEntity instanceof Player) {
			this.applyTag(damagingEntity, hurtPlayer);
		}
	}

	private applyTag(player: Player, opponent: Entity): void {
		const wasInCombat: boolean = this.inCombat(player.id);
		this._combatMap.set(player.id, {
			expireTick: system.currentTick + this.combatDurationTicks,
			lastHitterId: opponent.id,
		});
		if (!wasInCombat) {
			this.onCombatEnter.triggerEvent({ opponent: opponent, player: player });
		}
	}

	public clearCombat(playerId: string, triggerEvent = true): void {
		if (!this._combatMap.delete(playerId)) {
			return;
		}
		if (triggerEvent) {
			const player = world.getEntity(playerId);
			if (player instanceof Player && player.isValid) {
				this.onCombatExit.triggerEvent(player);
			}
		}
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
		this._combatMap.delete(playerId);
	}

	private entityHurt = (event: EntityHurtAfterEvent): void => {
		if (event.damageSource.damagingEntity !== undefined && event.hurtEntity instanceof Player) {
			this.setCombat(event.hurtEntity, event.damageSource.damagingEntity);
		}
	};

	private entityDie = (event: EntityDieAfterEvent): void => {
		if (!event.deadEntity.isValid || event.deadEntity instanceof Player === false) {
			return;
		}
		const combatEvent: KillTrackerEvent = {
			cause: event.damageSource.cause,
			deadPlayer: event.deadEntity,
			killer: event.damageSource.damagingEntity ?? this.getLastHitter(event.deadEntity),
		};
		this._combatMap.delete(event.deadEntity.id);
		if (event.damageSource.damagingEntity !== undefined) {
			this._combatMap.delete(event.damageSource.damagingEntity.id);
		}
		this.onKill.triggerEvent(combatEvent);
	};

	private playerLeave = (event: PlayerLeaveAfterEvent): void => {
		this.removePlayer(event.playerId);
	};

	public init(): void {
		if (!this._isInitialized) {
			world.afterEvents.entityHurt.subscribe(this.entityHurt);
			world.afterEvents.entityDie.subscribe(this.entityDie);
			world.afterEvents.playerLeave.subscribe(this.playerLeave);
			this._isInitialized = true;
		}
	}

	public shutdown(): void {
		if (this._isInitialized) {
			world.afterEvents.entityHurt.unsubscribe(this.entityHurt);
			world.afterEvents.entityDie.unsubscribe(this.entityDie);
			world.afterEvents.playerLeave.unsubscribe(this.playerLeave);
		}
	}
}
