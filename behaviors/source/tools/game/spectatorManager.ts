import { type Dimension, GameMode, type Player } from "@minecraft/server";
import { arrRemoveSwap, type TeleportLocation } from "../types";

export class SpectatorManager {
	public readonly spectators: Player[];
	public spawn: TeleportLocation;
	public dimension: Dimension;

	public constructor(dimension: Dimension, spawnPos: TeleportLocation) {
		this.spectators = [];
		this.spawn = spawnPos;
		this.dimension = dimension;
	}

	public add(player: Player): void {
		player.setGameMode(GameMode.Spectator);
		player.teleport(this.spawn.pos, {
			dimension: this.dimension,
			facingLocation: this.spawn.facing,
		});
		if (!this.spectators.includes(player)) {
			this.spectators.push(player);
		}
	}

	public remove(player: Player): void {
		arrRemoveSwap(this.spectators, player);
	}
}
