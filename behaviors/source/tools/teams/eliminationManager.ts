import {
	type Player,
	type PlayerLeaveAfterEvent,
	type PlayerSpawnAfterEvent,
	system,
} from "@minecraft/server";
import { PlayerManager } from "../playerManager";
import { EventSignal } from "../shared/eventSignal";
import { type TeleportLocation, teleportLocation } from "../shared/locations";

export interface PlayerRespawnEvent {
	isInitialTick: boolean;
	player: Player;
	ticksRemaining: number;
}

export interface PlayerEliminationEvent {
	player: Player | null; // null on disconnect
	playerId: string;
	playerName: string;
}

export class EliminationManager {
	public canRespawn: boolean;
	public respawnTimeTicks: number;
	public spawnPoint: TeleportLocation;
	public readonly onSpawn: EventSignal<PlayerSpawnAfterEvent>;
	public readonly onRespawnTick: EventSignal<PlayerRespawnEvent>;
	public readonly onPlayerElimination: EventSignal<PlayerEliminationEvent>;
	public readonly onFinalElimination: EventSignal<EliminationManager>;
	private readonly _players: PlayerManager;
	private readonly _respawnIntervalIds: Map<string, number>; // key is playerId

	public constructor(spawnPoint: TeleportLocation) {
		this.canRespawn = false;
		this.respawnTimeTicks = 0;
		this.spawnPoint = spawnPoint;
		this.onSpawn = new EventSignal();
		this.onRespawnTick = new EventSignal();
		this.onPlayerElimination = new EventSignal();
		this.onFinalElimination = new EventSignal();
		this._players = new PlayerManager();
		this._players.onDisconnect.subscribe(this.handleDisconnect);
		this._respawnIntervalIds = new Map();
	}

	private handleDisconnect = (event: PlayerLeaveAfterEvent): void => {
		this.clearRespawnInterval(event.playerId);
		this.onPlayerElimination.triggerEvent({
			player: null,
			playerId: event.playerId,
			playerName: event.playerName,
		});
	};

	private clearRespawnInterval(playerId: string): void {
		const intervalId: number | undefined = this._respawnIntervalIds.get(playerId);
		if (intervalId !== undefined) {
			system.clearRun(intervalId);
			this._respawnIntervalIds.delete(playerId);
		}
	}

	private clearAllRespawnIntervals(): void {
		for (const [, intervalId] of this._respawnIntervalIds) {
			system.clearRun(intervalId);
		}
		this._respawnIntervalIds.clear();
	}

	public getPlayers(): Player[] {
		return this._players.getAll();
	}

	public hasPlayer(player: Player): boolean {
		return this._players.has(player);
	}

	public addPlayer(player: Player): void {
		const oldManager = EliminationManager._globalPlayers.get(player.id);
		if (oldManager !== undefined) {
			oldManager.removePlayer(player);
		}
		this._players.add(player);
		EliminationManager._globalPlayers.set(player.id, this);
	}

	public removePlayer(player: Player | string): void {
		const id = typeof player === "string" ? player : player.id;
		this.clearRespawnInterval(id);
		if (this._players.remove(player)) {
			EliminationManager._globalPlayers.delete(id);
		}
	}

	public clearPlayers(): void {
		this.clearAllRespawnIntervals();
		this._players.clear();
	}

	public shutdown(): void {
		this.clearAllRespawnIntervals();
		this._players.shutdown();
	}

	public eliminate(player: Player): void {
		if (!this._players.remove(player)) {
			return;
		}
		this.clearRespawnInterval(player.id);
		this.onPlayerElimination.triggerEvent({
			player: player,
			playerId: player.id,
			playerName: player.name,
		});
		if (this._players.isEmpty) {
			this.onFinalElimination.triggerEvent(this);
		}
	}

	public eliminateAll(): void {
		const players: Player[] = this._players.getAll();
		this.clearAllRespawnIntervals();
		this._players.clear();
		for (const p of players) {
			this.onPlayerElimination.triggerEvent({
				player: p,
				playerId: p.id,
				playerName: p.name,
			});
		}
		if (players.length > 0) {
			this.onFinalElimination.triggerEvent(this);
		}
	}

	public spawn(player: Player): void {
		if (!this._players.has(player)) {
			return;
		}
		teleportLocation(player, this.spawnPoint);
		this.onSpawn.triggerEvent({ initialSpawn: true, player: player });
	}

	public spawnAll(): void {
		for (const p of this._players.getAll()) {
			this.spawn(p);
		}
	}

	// ticksToSubtract to account for time spent respawning
	// e.g. time before PlayerSpawnEvent is triggered
	public respawn(player: Player, ticksToSubtract = 0): void {
		if (this._respawnIntervalIds.has(player.id) || !this._players.has(player)) {
			return;
		}
		if (!this.canRespawn) {
			this.eliminate(player);
			return;
		}
		if (this.respawnTimeTicks <= 0) {
			this.spawn(player);
			return;
		}
		let ticksRemaining = this.respawnTimeTicks - ticksToSubtract;
		this.onRespawnTick.triggerEvent({
			isInitialTick: true,
			player: player,
			ticksRemaining: ticksRemaining,
		});
		const intervalId: number = system.runInterval(() => {
			if (!player.isValid) {
				this.clearRespawnInterval(player.id);
				return;
			}
			if (ticksRemaining <= 0) {
				this.clearRespawnInterval(player.id);
				this.spawn(player);
				return;
			}
			this.onRespawnTick.triggerEvent({
				isInitialTick: false,
				player: player,
				ticksRemaining: ticksRemaining,
			});
			ticksRemaining--;
		});
		this._respawnIntervalIds.set(player.id, intervalId);
	}

	private static readonly _globalPlayers = new Map<string, EliminationManager>();

	public static findPlayer(playerId: string): EliminationManager | undefined {
		return EliminationManager._globalPlayers.get(playerId);
	}
}
