import {
	type Dimension,
	type DimensionRegistry,
	type Entity,
	Player,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import type { ProjectileTracker } from "../entities/projectileTracker";
import { playerRoomTracker, rooms } from "./roomManager";

export interface RoomConfig {
	dimensionId: string;
	roomIndex: number;
	displayName: string;
	spawn: Vector3;
	onJoin?: (entity: Entity) => void;
	onLeave?: (entity: Entity) => void;
	projectileTracker?: ProjectileTracker;
}

export class Room {
	public readonly dimensionId: string;
	public roomIndex: number;
	public displayName: string;
	private _spawn: Vector3;
	private _onJoin: ((entity: Entity) => void) | undefined;
	private _onLeave: ((entity: Entity) => void) | undefined;
	private _dimension: Dimension | undefined;
	private projectileTracker: ProjectileTracker | undefined;

	public constructor(config: RoomConfig) {
		this.dimensionId = config.dimensionId;
		this.roomIndex = config.roomIndex;
		this.displayName = config.displayName;
		this._spawn = config.spawn;
		this._onJoin = config.onJoin;
		this._onLeave = config.onLeave;
		if (config.projectileTracker !== undefined) {
			this.projectileTracker = config.projectileTracker;
			world.afterEvents.entityRemove.subscribe(this.projectileTracker.entityRemoveCallback);
			world.afterEvents.entitySpawn.subscribe(this.projectileTracker.entitySpawnCallback);
		}
	}

	public get dimension(): Dimension | undefined {
		return this._dimension;
	}

	public registerDimension(dimensionRegistry: DimensionRegistry): void {
		if (!this.dimensionId.startsWith("minecraft:")) {
			dimensionRegistry.registerCustomDimension(this.dimensionId);
		}
		system.run(() => {
			this._dimension = world.getDimension(this.dimensionId);
		});
	}

	public join(entity: Entity): void {
		if (!entity.isValid || this._dimension === undefined) {
			return;
		}
		const previousRoomIndex: number | undefined = playerRoomTracker.get(entity.id);
		if (previousRoomIndex !== undefined) {
			const previousRoom: Room | undefined = rooms[previousRoomIndex];
			if (previousRoom) {
				previousRoom.leave(entity);
			}
		}
		entity.teleport(this._spawn, { dimension: this._dimension });
		if (this._onJoin) {
			this._onJoin(entity);
		}
		if (entity instanceof Player) {
			playerRoomTracker.set(entity.id, this.roomIndex);
		}
	}

	public leave(entity: Entity): void {
		if (!entity.isValid) {
			return;
		}
		if (this._onLeave) {
			this._onLeave(entity);
		}
		if (!(entity instanceof Player)) {
			return;
		}
		playerRoomTracker.delete(entity.id);
		if (this.projectileTracker !== undefined) {
			this.projectileTracker.removePlayerProjectiles(entity);
		}
	}
}
