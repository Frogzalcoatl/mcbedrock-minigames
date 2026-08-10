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

export interface KillTrackerConfig {
	cooldownTicks: number;
	includeMobKills: boolean;
	showCombatTimeCallback?: (player: Player) => void;
	onKill?: (event: EntityDieAfterEvent) => void;
}

export class KillTracker {
	public readonly dimensionId: string;
	public cooldownTicks: number;
	public showCombatTime: boolean;
	public includeMobKills: boolean;
	private _hitMap: Map<string, [string, number]>; // [playerId, [hitterId, timestamp (Date.now())]]
	private entityHurt: ((event: EntityHurtAfterEvent) => void) | null;
	private entityDie: ((event: EntityDieAfterEvent) => void) | null;
	public onKill: ((event: EntityDieAfterEvent) => void) | null; // dimensionId is validated before running
	public showCombatTimeCallback: ((player: Player) => void) | null;
	private _showTimeMap: Map<string, number>; // [playerId, system.runInterval runId]

	constructor(
		dimensionId: string,
		cooldownTicks: number,
		includeMobKills: boolean,
		onKill: ((event: EntityDieAfterEvent) => void) | null,
		showCombatTimeCallback: ((player: Player) => void) | null,
	) {
		this.dimensionId = dimensionId;
		this.cooldownTicks = cooldownTicks;
		this.showCombatTime = showCombatTimeCallback !== null;
		this.includeMobKills = includeMobKills;
		this._hitMap = new Map<string, [string, number]>();
		this.onKill = onKill;
		this.showCombatTimeCallback = showCombatTimeCallback;
		this._showTimeMap = new Map<string, number>();
		this.entityHurt = null;
		this.entityDie = null;
	}

	public subscribe(): void {
		this.entityHurt = (event: EntityHurtAfterEvent): void => {
			if (
				event.hurtEntity.dimension.id !== this.dimensionId ||
				(event.damageSource.damagingEntity?.isValid &&
					event.damageSource.damagingEntity.dimension.id !== this.dimensionId) ||
				event.hurtEntity instanceof Player === false
			) {
				return;
			}
			if (
				event.damageSource.damagingEntity !== undefined &&
				(this.includeMobKills || event.damageSource.damagingEntity instanceof Player)
			) {
				this._hitMap.set(event.hurtEntity.id, [
					event.damageSource.damagingEntity.id,
					Date.now(),
				]);
				if (this.showCombatTime) {
					this.showCombatTimeTo(event.hurtEntity);
				}
				if (event.damageSource.damagingEntity instanceof Player) {
					this._hitMap.set(event.damageSource.damagingEntity.id, [
						event.hurtEntity.id,
						Date.now(),
					]);
					this.showCombatTimeTo(event.damageSource.damagingEntity);
				}
			}
		};
		this.entityDie = (event: EntityDieAfterEvent): void => {
			if (
				!event.deadEntity.isValid ||
				event.deadEntity.dimension.id !== this.dimensionId ||
				(!this.includeMobKills && event.deadEntity instanceof Player === false)
			) {
				return;
			}
			if (
				event.damageSource.damagingEntity === undefined &&
				event.deadEntity instanceof Player
			) {
				// Not able to directly set last hitter to original event for some reason.
				const newEvent: EntityDieAfterEvent | null = this.createDeathEvent(
					event.deadEntity,
				);
				if (newEvent !== null) {
					event = newEvent;
				}
			}
			this._hitMap.delete(event.deadEntity.id);
			if (event.damageSource.damagingEntity instanceof Player) {
				this._hitMap.delete(event.damageSource.damagingEntity.id);
			}
			if (this.onKill !== null) {
				this.onKill(event);
			}
		};
		world.afterEvents.entityHurt.subscribe(this.entityHurt);
		world.afterEvents.entityDie.subscribe(this.entityDie);
	}

	public unsubscribe(): void {
		if (this.entityHurt !== null) {
			world.afterEvents.entityHurt.unsubscribe(this.entityHurt);
		}
		if (this.entityDie !== null) {
			world.afterEvents.entityDie.unsubscribe(this.entityDie);
		}
	}

	// Returns true when in combat
	private inCombatCondition(timestamp: number): boolean {
		return timestamp >= Date.now() - this.cooldownTicks * 50;
	}

	public inCombat(player: Player): boolean {
		const entry = this._hitMap.get(player.id);
		if (entry === undefined) {
			return false;
		}
		const [, timestamp] = entry;
		return this.inCombatCondition(timestamp);
	}

	public getLastHitter(player: Player): Entity | null {
		const entry = this._hitMap.get(player.id);
		if (entry === undefined) {
			return null;
		}
		const [lastHitterId, timestamp] = entry;
		if (!this.inCombatCondition(timestamp)) {
			return null;
		}
		const lastHitter = world.getEntity(lastHitterId);
		if (lastHitter === undefined || !lastHitter.isValid) {
			return null;
		}
		return lastHitter;
	}

	public removePlayer(player: Player): void {
		this._hitMap.delete(player.id);
		const runId: number | undefined = this._showTimeMap.get(player.id);
		if (runId !== undefined) {
			system.clearRun(runId);
		}
	}

	private createDeathEvent(player: Player): EntityDieAfterEvent | null {
		const entry = this._hitMap.get(player.id);
		if (entry === undefined) {
			return null;
		}
		const [hitterId] = entry;
		let hitter: Entity | undefined;
		try {
			hitter = world.getEntity(hitterId);
		} catch (_error) {
			return null;
		}
		let source: EntityDamageSource;
		if (hitter?.isValid) {
			source = {
				cause: EntityDamageCause.override,
				damagingEntity: hitter,
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

	// When a player leaves while in combat
	public simulatedDeath(player: Player): void {
		if (this.onKill === null) {
			return;
		}
		const event: EntityDieAfterEvent | null = this.createDeathEvent(player);
		if (event !== null) {
			this.onKill(event);
		}
	}

	public getCombatTimeTicks(player: Player): number {
		const entry = this._hitMap.get(player.id);
		if (entry === undefined) {
			return -1;
		}
		const [, timestamp] = entry;
		const now: number = Date.now();
		if (timestamp < now - this.cooldownTicks * 50) {
			return -1;
		}
		return (timestamp - now) / 50 + this.cooldownTicks;
	}

	private showCombatTimeTo(player: Player): void {
		const oldRunId: number | undefined = this._showTimeMap.get(player.id);
		if (oldRunId !== undefined) {
			system.clearRun(oldRunId);
		}
		system.run(() => {
			// So callback is run on first tick
			if (this.showCombatTimeCallback !== null) {
				this.showCombatTimeCallback(player);
			}
		});
		const runId: number = system.runInterval(() => {
			if (!this.inCombat(player)) {
				system.clearRun(runId);
				return;
			}
			if (this.showCombatTimeCallback !== null) {
				this.showCombatTimeCallback(player);
			}
		}, 2);
		this._showTimeMap.set(player.id, runId);
	}
}
