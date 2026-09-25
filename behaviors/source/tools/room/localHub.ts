import { type Dimension, type DimensionLocation, type Player, world } from "@minecraft/server";
import { arrRemoveSwap, EventSignal, type TeleportLocation } from "../../types";

export class LocalHub {
	public readonly dimensionId: string;
	public onJoin: EventSignal<Player>;
	public onLeave: EventSignal<Player>;
	public players: Player[];
	private _spawn: TeleportLocation;
	private _isActive: boolean;

	public constructor(dimensionId: string, spawn: TeleportLocation) {
		this.dimensionId = dimensionId;
		this._spawn = spawn;
		this._isActive = true;
		this.players = [];
		this.onJoin = new EventSignal<Player>();
		this.onLeave = new EventSignal<Player>();
	}

	public get isActive(): boolean {
		return this._isActive;
	}

	public set isActive(val: boolean) {
		if (!val) {
			this.players.length = 0;
		}
		this._isActive = val;
	}

	public get spawn(): TeleportLocation {
		return this._spawn;
	}

	public set spawn(val: TeleportLocation) {
		this._spawn = val;
		const dimension: Dimension = world.getDimension(this.dimensionId);
		const location: DimensionLocation = {
			dimension: dimension,
			x: val.pos.x,
			y: val.pos.y,
			z: val.pos.z,
		};
		for (const player of this.players) {
			player.setSpawnPoint(location);
		}
	}

	public has(player: Player): boolean {
		return this.players.indexOf(player) !== -1;
	}

	public join(player: Player): void {
		if (!this.isActive) {
			player.sendMessage("§cUnable to join inactive hub");
			return;
		}
		if (!this.players.includes(player)) {
			this.players.push(player);
		}
		const dimension: Dimension = world.getDimension(this.dimensionId);
		player.teleport(this._spawn.pos, {
			dimension: dimension,
			facingLocation: this._spawn.facing,
		});
		player.setSpawnPoint({
			dimension: dimension,
			x: this._spawn.pos.x,
			y: this._spawn.pos.y,
			z: this._spawn.pos.z,
		});
		this.onJoin.triggerEvent(player);
	}

	public leave(player: Player): void {
		if (!this.isActive) {
			return;
		}
		arrRemoveSwap(this.players, player);
		this.onLeave.triggerEvent(player);
	}
}
