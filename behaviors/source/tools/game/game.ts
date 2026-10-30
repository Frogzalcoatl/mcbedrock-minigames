import { type Dimension, type Player, type PlayerLeaveAfterEvent, world } from "@minecraft/server";
import type { GameHub } from "../room/gameHub";
import {
	arrRemoveByCallback,
	type GameJoinResult,
	type TeleportLocation,
	teleportLocationDefault,
} from "../types";

world.afterEvents.playerLeave.subscribe((event: PlayerLeaveAfterEvent): void => {
	const game: Game | undefined = Game.findPlayer(event.playerId);
	if (game !== undefined) {
		game.leave(event.playerId);
	}
});

export abstract class Game {
	private static _globalPlayers = new Map<string, Game>(); // key is player id

	public static findPlayer(playerId: string): Game | undefined {
		return Game._globalPlayers.get(playerId);
	}

	public readonly players: Player[];
	public id: string;
	public dimension: Dimension;
	public spawn: TeleportLocation;
	public hub: Game | null;
	// Players join this on /hub if not null, otherwise queues main hub

	public constructor(
		id: string,
		dimension: Dimension,
		spawn: TeleportLocation = teleportLocationDefault(),
	) {
		this.players = [];
		this.id = id;
		this.dimension = dimension;
		this.spawn = spawn;
		this.hub = null;
	}

	protected addPlayer(player: Player): boolean {
		if (this.players.includes(player)) {
			return false;
		}
		Game._globalPlayers.set(player.id, this);
		this.players.push(player);
		return true;
	}

	protected removePlayer(playerId: string): void {
		if (arrRemoveByCallback(this.players, (p) => p.id === playerId) !== undefined) {
			Game._globalPlayers.delete(playerId);
		}
	}

	public abstract canJoin(player: Player): GameJoinResult;

	public abstract join(player: Player): GameJoinResult;

	public abstract leave(playerId: string): void;

	public abstract reset(): void;
}
