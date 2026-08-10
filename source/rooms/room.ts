import {
	type Dimension,
	type DimensionRegistry,
	EntityComponentTypes,
	type EntityRideableComponent,
	type EntityRidingComponent,
	type Player,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import { loadStructure } from "../structures/load";
import {
	type BlockInteractionConfig,
	initBlockInteractionManager,
} from "./modules/blockInteraction";
import { getKillTracker, type KillTracker, type KillTrackerConfig } from "./modules/killTracker";
import { getProjectileTracker, type ProjectileTracker } from "./modules/projectileTracker";
import { getPlayerRoom } from "./roomManager";

export interface RoomStructure {
	id: string;
	pos: Vector3;
}

export interface RoomConfig {
	dimensionId: string;
	roomTypeIndex: number;
	roomIndex: number;
	displayName: string;
	icon: string;
	spawn: Vector3;
	beforeJoin?: (player: Player) => Promise<boolean>; // Return true if player should join room, false if join attempt should be ignored
	onJoin?: (player: Player) => void;
	beforeLeave?: (player: Player) => Promise<boolean>; // Return true if player should leave room, false if leave attempt should be ignored
	onLeave?: (player: Player) => void;
	structures?: RoomStructure[];
	projectileTrackerTypeIds?: string[];
	blockInteraction?: BlockInteractionConfig;
	killTracker?: KillTrackerConfig;
}

export type RoomCreationFunc = (
	roomTypeIndex: number,
	roomIndex: number,
	dimensionId: string,
	displayName: string,
	icon: string,
) => Room;

export class Room {
	public readonly dimensionId: string;
	public readonly roomTypeIndex: number;
	public readonly roomIndex: number;
	public displayName: string;
	public icon: string;
	public readonly structures: RoomStructure[];
	private _dimension: Dimension | undefined;
	private _spawn: Vector3;
	private _beforeJoin: ((player: Player) => Promise<boolean>) | undefined;
	private _onJoin: ((player: Player) => void) | undefined;
	private _beforeLeave: ((player: Player) => Promise<boolean>) | undefined;
	private _onLeave: ((player: Player) => void) | undefined;
	// Modules:
	private _projectileTracker: ProjectileTracker | null;
	public readonly blockInteraction: boolean;
	private _killTracker: KillTracker | null;

	public constructor(config: RoomConfig) {
		this.dimensionId = config.dimensionId;
		this.roomTypeIndex = config.roomTypeIndex;
		this.roomIndex = config.roomIndex;
		this.displayName = config.displayName;
		this.icon = config.icon ?? "";
		this.structures = config.structures ?? [];
		this._spawn = config.spawn;
		this._beforeJoin = config.beforeJoin;
		this._onJoin = config.onJoin;
		this._beforeLeave = config.beforeLeave;
		this._onLeave = config.onLeave;
		if (config.projectileTrackerTypeIds === undefined) {
			this._projectileTracker = null;
		} else {
			this._projectileTracker = getProjectileTracker(
				this.dimensionId,
				config.projectileTrackerTypeIds,
			);
		}
		if (config.blockInteraction === undefined) {
			this.blockInteraction = false;
		} else {
			initBlockInteractionManager(
				this.dimensionId,
				config.blockInteraction.beforeEvent,
				config.blockInteraction.afterEvent,
			);
			this.blockInteraction = true;
		}
		if (config.killTracker === undefined) {
			this._killTracker = null;
		} else {
			this._killTracker = getKillTracker(
				this.dimensionId,
				config.killTracker.onKill ?? null,
				config.killTracker.cooldownTicks,
				config.killTracker.includeMobKills,
			);
		}
	}

	public get dimension(): Dimension | undefined {
		return this._dimension;
	}

	public get playerCount(): number | null {
		return this._dimension?.getPlayers().length ?? null;
	}

	public registerDimension(dimensionRegistry: DimensionRegistry): void {
		if (!this.dimensionId.startsWith("minecraft:")) {
			dimensionRegistry.registerCustomDimension(this.dimensionId);
		}
		system.run(() => {
			this._dimension = world.getDimension(this.dimensionId);
		});
	}

	public async join(player: Player): Promise<void> {
		if (!player.isValid || this._dimension === undefined) {
			return;
		}
		if (this._beforeJoin !== undefined) {
			const result: boolean = await this._beforeJoin(player);
			if (!result) {
				return;
			}
		}
		const previousRoom: Room | null = getPlayerRoom(player);
		if (previousRoom !== null) {
			previousRoom.leave(player);
		}
		player.teleport(this._spawn, { dimension: this._dimension });
		if (this._onJoin) {
			this._onJoin(player);
		}
		if (previousRoom === null || previousRoom.dimensionId !== this.dimensionId) {
			player.sendMessage(`§7Joined: ${this.displayName}`);
		}
	}

	public async leave(player: Player): Promise<void> {
		if (!player.isValid) {
			return;
		}
		if (this._beforeLeave !== undefined) {
			const result: boolean = await this._beforeLeave(player);
			if (!result) {
				return;
			}
		}
		if (this._onLeave) {
			this._onLeave(player);
		}
		this.removePlayer(player);
	}

	// doesnt run any leave callbacks or teleportation
	public removePlayer(player: Player): void {
		const riding: EntityRidingComponent | undefined = player.getComponent(
			EntityComponentTypes.Riding,
		);
		if (riding !== undefined) {
			// If i dont do this, player is teleported to the mount location in the new dimension for some reason
			const rideable: EntityRideableComponent | undefined =
				riding.entityRidingOn.getComponent(EntityComponentTypes.Rideable);
			if (rideable !== undefined) {
				rideable.ejectRider(player);
			}
		}
		if (this._projectileTracker !== null) {
			this._projectileTracker.removePlayerProjectiles(player);
		}
		if (this._killTracker !== null) {
			this._killTracker.map.delete(player.id);
		}
	}

	public loadStructure(index: number | "all"): void {
		if (this._dimension === undefined) {
			return;
		}
		if (index === "all") {
			for (const s of this.structures) {
				loadStructure(s.id, s.pos, this._dimension);
			}
		} else {
			const structure: RoomStructure | undefined = this.structures[index];
			if (structure !== undefined) {
				loadStructure(structure.id, structure.pos, this._dimension);
			}
		}
	}

	public sendMessage(message: string): void {
		if (this._dimension !== undefined) {
			for (const player of this._dimension.getPlayers()) {
				player.sendMessage(message);
			}
		}
	}

	public info(): string {
		return `
Dimension ID: §e${this.dimensionId}§r
Room Index: §e${this.roomIndex}§r
Display Name: §e${this.displayName}§r
Icon: §e${this.icon}§r
Player Count: §e${this.playerCount}§r
Spawn: §e${this._spawn.x} ${this._spawn.y} ${this._spawn.z}§r
Saved Structures: §e${this.structures.length}§r
Projectile Tracker: §e${this._projectileTracker !== null}§r
Block Interaction Manager: §e${this.blockInteraction}§r
Kill Tracker: §e${this._killTracker !== null}§r
`.trim();
	}

	// Modules:
	public removePlayerProjectiles(player: Player): void {
		if (this._projectileTracker === null) {
			return;
		}
		this._projectileTracker.removePlayerProjectiles(player);
	}
}
