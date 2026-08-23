import { type Dimension, type Player, type Vector3, world } from "@minecraft/server";
import { clearPlayerCooldowns } from "../items/utils/cooldown";
import { portalSoundRunInterval } from "../player/portalSound";

export interface RoomHubConfig {
	onJoin?: (player: Player) => void;
	onLeave?: (player: Player) => void;
}

export class RoomHub {
	public readonly dimensionId: string;
	private _spawn: Vector3;
	private _isActive: boolean;
	private _playerIds: Set<string>;
	private _onJoin: ((player: Player) => void) | null;
	private _onLeave: ((player: Player) => void) | null;

	constructor(
		dimensionId: string,
		spawn: Vector3,
		onJoin?: (player: Player) => void,
		onLeave?: (player: Player) => void,
	) {
		this.dimensionId = dimensionId;
		this._spawn = spawn;
		this._isActive = true;
		this._playerIds = new Set<string>();
		this._onJoin = onJoin ?? null;
		this._onLeave = onLeave ?? null;
	}

	public get isActive(): boolean {
		return this._isActive;
	}

	public set isActive(val: boolean) {
		if (!val) {
			this._playerIds.clear();
		}
		this._isActive = val;
	}

	public has(player: Player): boolean {
		return this._playerIds.has(player.id);
	}

	public join(player: Player): void {
		if (!this.isActive) {
			return;
		}
		this._playerIds.add(player.id);
		const dimension: Dimension = world.getDimension(this.dimensionId);
		player.teleport(this._spawn, { dimension: dimension });
		portalSoundRunInterval(player);
		player.setSpawnPoint({
			dimension: dimension,
			x: this._spawn.x,
			y: this._spawn.y,
			z: this._spawn.z,
		});
		clearPlayerCooldowns(player);
		if (this._onJoin !== null) {
			this._onJoin(player);
		}
	}

	public leave(player: Player): void {
		if (!this.isActive) {
			return;
		}
		if (this._onLeave !== null) {
			this._onLeave(player);
		}
		this.removePlayer(player);
	}

	public removePlayer(player: Player): void {
		this._playerIds.delete(player.id);
	}
}
