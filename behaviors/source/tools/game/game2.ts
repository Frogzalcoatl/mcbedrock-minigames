import type { Dimension, Player } from "@minecraft/server";
import { GameState } from "../types";
import { SpectatorManager } from "./spectatorManager";
import { WaitingRoom } from "./waitingRoom";

export abstract class Game {
	public waitingRoom: WaitingRoom;
	public readonly players: Player[];
	public state: GameState;
	public dimension: Dimension;
	public spectators: SpectatorManager;

	public constructor(
		dimension: Dimension,
		playersToStart: number,
		minPlayers: number,
		maxPlayers: number,
	) {
		this.waitingRoom = new WaitingRoom(playersToStart, minPlayers, maxPlayers);
		this.players = this.waitingRoom.players;
		this.state = GameState.Queuing;
		this.dimension = dimension;
		this.spectators = new SpectatorManager(dimension);
	}

	private waitingRoomOnStart(): void {
		
	}

	public join(player: Player): void {
		if (!this.players.includes(player)) {
			this.players.push(player);
		}
	}
}
