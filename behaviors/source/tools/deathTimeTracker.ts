import {
	type EntityDieAfterEvent,
	Player,
	type PlayerLeaveAfterEvent,
	system,
	world,
} from "@minecraft/server";

export class DeathTimeTracker {
	private readonly _deathTimes: Map<string, number>;
	private _isInitialized: boolean;

	public constructor() {
		this._deathTimes = new Map();
		this._isInitialized = false;
	}

	private entityDie = (event: EntityDieAfterEvent): void => {
		if (event.deadEntity instanceof Player === false || !event.deadEntity.isValid) {
			return;
		}
		this._deathTimes.set(event.deadEntity.id, system.currentTick);
	};

	private playerLeave = (event: PlayerLeaveAfterEvent): void => {
		this._deathTimes.delete(event.playerId);
	};

	public init(): void {
		if (!this._isInitialized) {
			world.afterEvents.entityDie.subscribe(this.entityDie);
			world.afterEvents.playerLeave.subscribe(this.playerLeave);
			this._isInitialized = true;
		}
	}

	public shutdown(): void {
		if (this._isInitialized) {
			world.afterEvents.entityDie.unsubscribe(this.entityDie);
			world.afterEvents.playerLeave.unsubscribe(this.playerLeave);
			this._isInitialized = false;
		}
	}

	public ticksSinceDeath(playerId: string): number | undefined {
		const timestamp: number | undefined = this._deathTimes.get(playerId);
		if (timestamp === undefined) {
			return undefined;
		}
		return system.currentTick - timestamp;
	}
}
