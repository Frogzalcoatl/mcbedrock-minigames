import type { Dimension, DimensionLocation, Player } from "@minecraft/server";
import { arrRemoveByCallback, EventSignal, type TeleportLocation } from "../types";

export interface GameHubTransferEvent {
	hub: GameHub;
	player: Player | undefined;
	playerId: string;
}

export class GameHub {
	public readonly onJoin: EventSignal<GameHubTransferEvent>;
	public readonly onLeave: EventSignal<GameHubTransferEvent>;
	public readonly players: Player[];
	private _dimension: Dimension;
	private _spawn: TeleportLocation;

	public constructor(dimension: Dimension, spawn: TeleportLocation) {
		this.players = [];
		this.onJoin = new EventSignal<GameHubTransferEvent>();
		this.onLeave = new EventSignal<GameHubTransferEvent>();
		this._dimension = dimension;
		this._spawn = spawn;
	}

	private resetSpawnpoint(): void {
		const location: DimensionLocation = {
			dimension: this._dimension,
			x: this.spawn.pos.x,
			y: this.spawn.pos.y,
			z: this.spawn.pos.z,
		};
		for (const player of this.players) {
			player.setSpawnPoint(location);
		}
	}

	public get spawn(): TeleportLocation {
		return this._spawn;
	}

	public set spawn(val: TeleportLocation) {
		this._spawn = val;
		this.resetSpawnpoint();
	}

	public get dimension(): Dimension {
		return this._dimension;
	}

	public set dimension(val: Dimension) {
		this._dimension = val;
		this.resetSpawnpoint();
	}

	public has(player: Player): boolean {
		return this.players.indexOf(player) !== -1;
	}

	public join(player: Player): void {
		if (!this.players.includes(player)) {
			this.players.push(player);
		}
		player.teleport(this._spawn.pos, {
			dimension: this.dimension,
			facingLocation: this._spawn.facing,
		});
		player.setSpawnPoint({
			dimension: this.dimension,
			x: this._spawn.pos.x,
			y: this._spawn.pos.y,
			z: this._spawn.pos.z,
		});
		this.onJoin.triggerEvent({ hub: this, player: player, playerId: player.id });
	}

	public leave(playerId: string): void {
		const removedPlayer: Player | undefined = arrRemoveByCallback(
			this.players,
			(p) => p.id === playerId,
		);
		this.onLeave.triggerEvent({ hub: this, player: removedPlayer, playerId: playerId });
	}
}
