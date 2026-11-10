/** biome-ignore-all lint/style/useNamingConvention: GameJoinResult enum style */
import type { Player, PlayerLeaveAfterEvent } from "@minecraft/server";
import { PlayerManager } from "../../tools/playerManager";
import type { TeleportLocation } from "../../tools/shared/locations";

// biome-ignore assist/source/useSortedKeys: enum style
export const GameJoinResult = {
	Success: 0,
	Failure: 1,
	Spectate: 2,
};
export type GameJoinResult = (typeof GameJoinResult)[keyof typeof GameJoinResult];

export abstract class Game {
	private static _globalPlayerIds = new Map<string, Game>();

	public static findPlayer(playerId: string): Game | undefined {
		return Game._globalPlayerIds.get(playerId);
	}

	public id: string;
	public spawn: TeleportLocation;
	private readonly _players: PlayerManager;

	public constructor(id: string, spawn: TeleportLocation) {
		this.id = id;
		this.spawn = spawn;
		this._players = new PlayerManager();
		this._players.onDisconnect.subscribe(this.handleDisconnect);
	}

	public get playerCount(): number {
		return this._players.size;
	}

	private handleDisconnect = (event: PlayerLeaveAfterEvent): void => {
		Game._globalPlayerIds.delete(event.playerId);
		this.leave(event.playerId);
	};

	protected addPlayer(player: Player): void {
		const oldGame: Game | undefined = Game._globalPlayerIds.get(player.id);
		if (oldGame !== undefined) {
			oldGame.removePlayer(player);
		}
		Game._globalPlayerIds.set(player.id, this);
		this._players.add(player);
	}

	protected removePlayer(player: Player): void {
		Game._globalPlayerIds.delete(player.id);
		this._players.remove(player);
	}

	protected shutdownPlayerManager(): void {
		this._players.shutdown();
	}

	public getPlayers(): Player[] {
		return this._players.getAll();
	}

	public abstract canJoin(player: Player): GameJoinResult;

	public abstract join(player: Player): GameJoinResult;

	public abstract leave(player: Player | string): void;

	public abstract reset(): void;

	public abstract shutdown(): void;
}
