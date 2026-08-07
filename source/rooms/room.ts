import {
	type Dimension,
	type DimensionRegistry,
	type Player,
	type PlayerInteractWithBlockAfterEvent,
	type PlayerInteractWithBlockBeforeEvent,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import { loadStructure } from "../structures/load";
import { initBlockInteractionManager } from "./modules/blockInteraction";
import { type DeathMessageFunc, initDeathMessages } from "./modules/deathMessages";
import { getProjectileTracker, type ProjectileTracker } from "./modules/projectileTracker";
import { getPlayerRoom, playerRoomTracker } from "./roomManager";

interface RoomStructure {
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
	blockInteraction?: {
		beforeEvent: ((event: PlayerInteractWithBlockBeforeEvent) => void) | "default" | undefined; // dimensionId is already checked before running
		afterEvent: ((event: PlayerInteractWithBlockAfterEvent) => void) | undefined; // dimensionId is already checked before running
	};
	deathMessages?: DeathMessageFunc;
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
	private _dimension: Dimension | undefined;
	private _playerCount: number;
	private _spawn: Vector3;
	private _beforeJoin: ((player: Player) => Promise<boolean>) | undefined;
	private _onJoin: ((player: Player) => void) | undefined;
	private _beforeLeave: ((player: Player) => Promise<boolean>) | undefined;
	private _onLeave: ((player: Player) => void) | undefined;
	private _structures: RoomStructure[];
	// Modules:
	private _projectileTracker: ProjectileTracker | null;
	public readonly blockInteraction: boolean;
	public readonly deathMessagesEnabled: boolean;

	public constructor(config: RoomConfig) {
		this.dimensionId = config.dimensionId;
		this.roomTypeIndex = config.roomTypeIndex;
		this.roomIndex = config.roomIndex;
		this.displayName = config.displayName;
		this.icon = config.icon ?? "";
		this._playerCount = 0;
		this._spawn = config.spawn;
		this._beforeJoin = config.beforeJoin;
		this._onJoin = config.onJoin;
		this._beforeLeave = config.beforeLeave;
		this._onLeave = config.onLeave;
		this._structures = config.structures ?? [];
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
		if (config.deathMessages === undefined) {
			this.deathMessagesEnabled = false;
		} else {
			initDeathMessages(this.roomTypeIndex, this.roomIndex, config.deathMessages);
			this.deathMessagesEnabled = true;
		}
	}

	public get dimension(): Dimension | undefined {
		return this._dimension;
	}

	public get playerCount(): number {
		return this._playerCount;
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
		playerRoomTracker.set(player.id, [this.roomTypeIndex, this.roomIndex]);
		this._playerCount++;
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
		playerRoomTracker.delete(player.id);
		this._playerCount--;
		if (this._projectileTracker !== null) {
			this._projectileTracker.removePlayerProjectiles(player);
		}
	}

	// joins without running any join/leave callbacks or teleportation
	public addPlayer(player: Player): void {
		playerRoomTracker.set(player.id, [this.roomTypeIndex, this.roomIndex]);
		this._playerCount++;
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
Icon: §e${this.icon}§r
Player Count: §e${this._playerCount}§r
Spawn: §e${this._spawn.x} ${this._spawn.y} ${this._spawn.z}§r
Saved Structures: §e${this._structures.length}§r
Projectile Tracker: §e${this._projectileTracker !== null}§r
Block Interaction Manager: §e${this.blockInteraction}§r
Death Messages: §e${this.deathMessagesEnabled}§r
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
