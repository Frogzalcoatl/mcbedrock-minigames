import { type Dimension, GameMode, type Player } from "@minecraft/server";
import { arrRemoveByCallback, type TeleportLocation } from "../../types";

export class SpectatorManager {
	public readonly players: Player[];
	public spawn: TeleportLocation;
	public dimension: Dimension;

	public constructor(
		dimension: Dimension,
		spawn: TeleportLocation = {
			facing: { x: 0.5, y: 0, z: 0.5 },
			pos: { x: 0.5, y: 0, z: 0.5 },
		},
	) {
		this.players = [];
		this.spawn = spawn;
		this.dimension = dimension;
	}

	public addPlayer(player: Player): void {
		player.setGameMode(GameMode.Spectator);
		player.teleport(this.spawn.pos, {
			dimension: this.dimension,
			facingLocation: this.spawn.facing,
		});
		if (!this.players.includes(player)) {
			this.players.push(player);
		}
	}

	public removePlayer(playerId: string): void {
		arrRemoveByCallback(this.players, (p) => p.id === playerId);
	}
}
