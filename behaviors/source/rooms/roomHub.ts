import {
	type Dimension,
	type DimensionLocation,
	type Entity,
	Player,
	type Vector3,
	world,
} from "@minecraft/server";
import { EventSignal, type PlayerEvent } from "../eventSignal";
import { itemCooldownRemovePlayer } from "../items/utils/cooldown";
import { portalSoundRunInterval } from "../player/portalSound";

export class RoomHub {
	public readonly dimensionId: string;
	public onJoin: EventSignal<PlayerEvent>;
	public onLeave: EventSignal<PlayerEvent>;
	private _spawn: Vector3;
	private _isActive: boolean;
	private _playerIds: Set<string>;

	public constructor(dimensionId: string, spawn: Vector3) {
		this.dimensionId = dimensionId;
		this._spawn = spawn;
		this._isActive = true;
		this._playerIds = new Set<string>();
		this.onJoin = new EventSignal<PlayerEvent>();
		this.onLeave = new EventSignal<PlayerEvent>();
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

	public get spawn(): Vector3 {
		return this._spawn;
	}

	public set spawn(val: Vector3) {
		this._spawn = val;
		const dimension: Dimension = world.getDimension(this.dimensionId);
		const location: DimensionLocation = { dimension: dimension, x: val.x, y: val.y, z: val.z };
		for (const playerId of this._playerIds) {
			const player: Entity | undefined = world.getEntity(playerId);
			if (player === undefined || player instanceof Player === false) {
				continue;
			}
			player.setSpawnPoint(location);
		}
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
		itemCooldownRemovePlayer(player);
		const event: PlayerEvent = {
			player: player,
		};
		this.onJoin.triggerEvent(event);
	}

	public leave(player: Player): void {
		if (!this.isActive) {
			return;
		}
		const event: PlayerEvent = {
			player: player,
		};
		this.onLeave.triggerEvent(event);
		this.removePlayer(player);
	}

	public removePlayer(player: Player): void {
		this._playerIds.delete(player.id);
	}
}
