import {
	type Dimension,
	type DimensionRegistry,
	type Entity,
	Player,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import { loadStructure } from "../structures/load";
import type { BlockInteractionManager } from "./modules/blockInteraction";
import type { DeathMessageManager } from "./modules/deathMessages";
import type { ProjectileTracker } from "./modules/projectileTracker";
import { playerRoomTracker, rooms } from "./roomManager";

interface RoomStructure {
	id: string;
	pos: Vector3;
}

export interface RoomConfig {
	dimensionId: string;
	roomIndex: number;
	displayName: string;
	spawn: Vector3;
	onJoin?: (entity: Entity) => void;
	onLeave?: (entity: Entity) => void;
	structures?: RoomStructure[];
	projectileTracker?: ProjectileTracker;
	blockInteraction?: BlockInteractionManager;
	deathMessages?: DeathMessageManager;
}

export class Room {
	public readonly dimensionId: string;
	public roomIndex: number;
	public displayName: string;
	private _dimension: Dimension | undefined;
	private _spawn: Vector3;
	private _onJoin: ((entity: Entity) => void) | undefined;
	private _onLeave: ((entity: Entity) => void) | undefined;
	private _structures: RoomStructure[];
	private _projectileTracker: ProjectileTracker | null;
	private _blockInteraction: BlockInteractionManager | null;
	private _deathMessages: DeathMessageManager | null;

	public constructor(config: RoomConfig) {
		this.dimensionId = config.dimensionId;
		this.roomIndex = config.roomIndex;
		this.displayName = config.displayName;
		this._spawn = config.spawn;
		this._onJoin = config.onJoin;
		this._onLeave = config.onLeave;
		this._structures = config.structures ?? [];
		if (config.projectileTracker === undefined) {
			this._projectileTracker = null;
		} else {
			this._projectileTracker = config.projectileTracker;
			world.afterEvents.entityRemove.subscribe(this._projectileTracker.entityRemoveCallback);
			world.afterEvents.entitySpawn.subscribe(this._projectileTracker.entitySpawnCallback);
		}
		if (config.blockInteraction === undefined) {
			this._blockInteraction = null;
		} else {
			this._blockInteraction = config.blockInteraction;
			world.beforeEvents.playerInteractWithBlock.subscribe(
				this._blockInteraction.playerInteractWithBlock,
			);
		}
		if (config.deathMessages === undefined) {
			this._deathMessages = null;
		} else {
			this._deathMessages = config.deathMessages;
			world.afterEvents.entityDie.subscribe(this._deathMessages.entityDie);
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
		if (this._projectileTracker !== null) {
			this._projectileTracker.removePlayerProjectiles(entity);
		}
	}

	public loadStructures(): void {
		if (this._dimension === undefined) {
			return;
		}
		for (const s of this._structures) {
			loadStructure(s.id, s.pos, this._dimension);
		}
	}

	public info(): string {
		return `
Dimension ID: §e${this.dimensionId}§r
Room Index: §e${this.roomIndex}§r
Display Name: §e${this.displayName}§r
Spawn: §e${this._spawn.x} ${this._spawn.y} ${this._spawn.z}§r
Saved Structures: §e${this._structures.length}§r
Projectile Tracker: §e${this._projectileTracker !== null}§r
Block Interaction Manager: §e${this._blockInteraction !== null}§r
Death Message Manager: §e${this._deathMessages !== null}§r
`.trim();
	}
}
