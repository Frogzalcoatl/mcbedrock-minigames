import {
	type Dimension,
	type EntityDieAfterEvent,
	Player,
	type PlayerLeaveAfterEvent,
	type Vector3,
	world,
} from "@minecraft/server";

export interface DeathLocation {
	dimension: Dimension;
	pos: Vector3;
}

export class DeathLocationTracker {
	private readonly _locations: Map<string, DeathLocation>;
	private _isInitialized: boolean;

	public constructor() {
		this._locations = new Map();
		this._isInitialized = false;
	}

	private entityDie = (event: EntityDieAfterEvent): void => {
		if (event.deadEntity instanceof Player === false || !event.deadEntity.isValid) {
			return;
		}
		this._locations.set(event.deadEntity.id, {
			dimension: event.deadEntity.dimension,
			pos: event.deadEntity.location,
		});
	};

	private playerLeave = (event: PlayerLeaveAfterEvent): void => {
		this._locations.delete(event.playerId);
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

	public getLast(playerId: string): DeathLocation | undefined {
		return this._locations.get(playerId);
	}
}
