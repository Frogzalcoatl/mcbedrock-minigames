import { type Dimension, type DimensionLocation, type Player, world } from "@minecraft/server";
import { arrRemoveSwap, EventSignal, type TeleportLocation } from "../types";
import type { Room } from "./room";

export interface LocalHubTransferEvent {
	localHub: LocalHub;
	player: Player;
}

export class LocalHub {
	public readonly onJoin: EventSignal<LocalHubTransferEvent>;
	public readonly onLeave: EventSignal<LocalHubTransferEvent>;
	public readonly players: Player[];
	private _spawn: TeleportLocation;
	private _isActive: boolean;
	private _owningRoom: Room;

	public constructor(owningRoom: Room, spawn: TeleportLocation) {
		this.players = [];
		this.onJoin = new EventSignal<LocalHubTransferEvent>();
		this.onLeave = new EventSignal<LocalHubTransferEvent>();
		this._spawn = spawn;
		this._isActive = true;
		this._owningRoom = owningRoom;
		owningRoom.localHub = this;
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
		const dimension: Dimension = world.getDimension(this._owningRoom.dimensionId);
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
		const dimension: Dimension = world.getDimension(this._owningRoom.dimensionId);
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
		this.onJoin.triggerEvent({ localHub: this, player: player });
	}

	public leave(player: Player): void {
		if (!this.isActive) {
			return;
		}
		arrRemoveSwap(this.players, player);
		if (player.isValid) {
			const dimension: Dimension | undefined = this._owningRoom.dimension;
			if (dimension !== undefined) {
				player.setSpawnPoint({
					dimension: dimension,
					x: this._owningRoom.spawn.pos.x,
					y: this._owningRoom.spawn.pos.y,
					z: this._owningRoom.spawn.pos.z,
				});
			}
		}
		this.onLeave.triggerEvent({ localHub: this, player: player });
	}
}
