import { type PlayerSpawnAfterEvent, world } from "@minecraft/server";
import type { DeathTimeTracker } from "../deathTimeTracker";
import { EliminationManager } from "./eliminationManager";

export class EliminationRespawnManager {
	private _isInitialized: boolean;
	public readonly deathTimeTracker: DeathTimeTracker;

	public constructor(deathTimeTracker: DeathTimeTracker) {
		this._isInitialized = false;
		this.deathTimeTracker = deathTimeTracker;
	}

	private playerSpawn = (event: PlayerSpawnAfterEvent): void => {
		const eliminationManager = EliminationManager.findPlayer(event.player.id);
		if (eliminationManager === undefined) {
			return;
		}
		const ticksSinceDeath: number = this.deathTimeTracker.ticksSinceDeath(event.player.id) ?? 0;
		eliminationManager.respawn(event.player, ticksSinceDeath);
	};

	public init(): void {
		this.deathTimeTracker.init();
		if (!this._isInitialized) {
			world.afterEvents.playerSpawn.subscribe(this.playerSpawn);
			this._isInitialized = true;
		}
	}

	public shutdown(includeDeathTimeTracker = false): void {
		if (includeDeathTimeTracker) {
			this.deathTimeTracker.shutdown();
		}
		if (!this._isInitialized) {
			world.afterEvents.playerSpawn.unsubscribe(this.playerSpawn);
			this._isInitialized = false;
		}
	}
}
