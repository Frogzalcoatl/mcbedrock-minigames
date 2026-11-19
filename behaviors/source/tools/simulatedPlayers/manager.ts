import {
	type DimensionLocation,
	type EntityDieAfterEvent,
	GameMode,
	type PlayerLeaveAfterEvent,
	type PlayerSpawnAfterEvent,
	world,
} from "@minecraft/server";
import { SimulatedPlayer, spawnSimulatedPlayer } from "@minecraft/server-gametest";
import { EventSignal } from "../shared/eventSignal";

export interface SimulatedPlayerDisconnectEvent {
	playerId: string;
	playerName: string;
}

export class SimulatedPlayerManager {
	public readonly namespace: string;
	public readonly onDisconnect: EventSignal<SimulatedPlayerDisconnectEvent>;
	private readonly playerIds: Set<string>;
	private _autoRespawn: boolean;
	private _isInitialized: boolean;

	public constructor(namespace: string, autoRespawn: boolean) {
		this.namespace = namespace;
		this.onDisconnect = new EventSignal();
		this.playerIds = new Set();
		this._autoRespawn = false;
		this.autoRespawn = autoRespawn;
		this._isInitialized = false;
	}

	private entityDieHandler = (event: EntityDieAfterEvent): void => {
		if (event.deadEntity instanceof SimulatedPlayer) {
			event.deadEntity.respawn();
		}
	};

	public set autoRespawn(val: boolean) {
		if (val === this._autoRespawn) {
			return;
		}
		if (val) {
			world.afterEvents.entityDie.subscribe(this.entityDieHandler);
		} else {
			world.afterEvents.entityDie.unsubscribe(this.entityDieHandler);
		}
		this._autoRespawn = val;
	}

	public get autoRespawn(): boolean {
		return this._autoRespawn;
	}

	// Minecraft automatically handles duplicate names by appending numbers. ex: SimulatedPlayer(2)
	public spawn(
		location: DimensionLocation,
		amount = 1,
		name = "SimulatedPlayer",
		gameMode: GameMode = GameMode.Adventure,
	): void {
		for (let i = 0; i < amount; i++) {
			spawnSimulatedPlayer(location, name, gameMode);
		}
	}

	public clear(): void {
		for (const p of world.getAllPlayers()) {
			if (p instanceof SimulatedPlayer) {
				p.disconnect();
			}
		}
	}

	private playerSpawn = (event: PlayerSpawnAfterEvent): void => {
		if (!event.initialSpawn || event.player instanceof SimulatedPlayer === false) {
			return;
		}
		this.playerIds.add(event.player.id);
	};

	private playerLeave = (event: PlayerLeaveAfterEvent): void => {
		if (this.playerIds.delete(event.playerId)) {
			this.onDisconnect.triggerEvent({ playerId: event.playerId, playerName: event.playerName });
		}
	};

	private worldLoad = (): void => {
		for (const p of world.getAllPlayers()) {
			if (p instanceof SimulatedPlayer) {
				this.playerIds.add(p.id);
			}
		}
	};

	public init(): void {
		if (!this._isInitialized) {
			world.afterEvents.playerSpawn.subscribe(this.playerSpawn);
			world.afterEvents.playerLeave.subscribe(this.playerLeave);
			world.afterEvents.worldLoad.subscribe(this.worldLoad);
			this._isInitialized = true;
		}
	}

	public shutdown(): void {
		if (this._isInitialized) {
			world.afterEvents.playerSpawn.unsubscribe(this.playerSpawn);
			world.afterEvents.playerLeave.unsubscribe(this.playerLeave);
			world.afterEvents.worldLoad.unsubscribe(this.worldLoad);
			this._isInitialized = false;
		}
	}
}
