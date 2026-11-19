import {
	type EntityDieAfterEvent,
	Player,
	type PlayerSpawnAfterEvent,
	world,
} from "@minecraft/server";
import type { DeathTimeTracker } from "../deathTimeTracker";
import { EliminationManager } from "./eliminationManager";

export class EliminationManagerAutoRespawn {
	private _isInitialized: boolean;
	public readonly deathTimeTracker: DeathTimeTracker;

	public constructor(deathTimeTracker: DeathTimeTracker) {
		this._isInitialized = false;
		this.deathTimeTracker = deathTimeTracker;
	}

	private entityDie = (event: EntityDieAfterEvent): void => {
		if (!event.deadEntity.isValid || event.deadEntity instanceof Player === false) {
			return;
		}
		const manager = EliminationManager.findPlayer(event.deadEntity.id);
		if (manager !== undefined && !manager.canRespawn) {
			manager.eliminate(event.deadEntity);
		}
	};

	private playerSpawn = (event: PlayerSpawnAfterEvent): void => {
		if (event.initialSpawn) {
			return;
		}
		const manager = EliminationManager.findPlayer(event.player.id);
		if (manager === undefined) {
			return;
		}
		const ticksSinceDeath: number = this.deathTimeTracker.ticksSinceDeath(event.player.id) ?? 0;
		manager.respawn(event.player, ticksSinceDeath);
	};

	public init(): void {
		this.deathTimeTracker.init();
		if (!this._isInitialized) {
			world.afterEvents.entityDie.subscribe(this.entityDie);
			world.afterEvents.playerSpawn.subscribe(this.playerSpawn);
			this._isInitialized = true;
		}
	}

	public shutdown(shutdownDeathTimeTracker: boolean): void {
		if (shutdownDeathTimeTracker) {
			this.deathTimeTracker.shutdown();
		}
		if (!this._isInitialized) {
			world.afterEvents.entityDie.unsubscribe(this.entityDie);
			world.afterEvents.playerSpawn.unsubscribe(this.playerSpawn);
			this._isInitialized = false;
		}
	}
}
