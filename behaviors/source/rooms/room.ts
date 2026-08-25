import {
	type Dimension,
	type DimensionRegistry,
	type Player,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import { killTrackerHasDimension, killTrackerRemovePlayer } from "../entities/killTracker";
import { ejectFromMount } from "../entities/mount";
import {
	projectileTrackerHasDimension,
	projectileTrackerRemoveProjectiles,
} from "../entities/projectileTracker";
import { clearPlayerCooldowns } from "../items/utils/cooldown";
import { portalSoundRunInterval, portalSoundRunIntervalClear } from "../player/portalSound";
import { loadStructure } from "../structures/load";
import { RoomHub, type RoomHubConfig } from "./roomHub";
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
	structures?: RoomStructure[];
	hub?: RoomHubConfig;
	beforeJoin?: (player: Player) => Promise<boolean>; // Return true if player should join room, false if join attempt should be ignored
	onJoin?: (player: Player) => void;
	beforeLeave?: (player: Player) => Promise<boolean>; // Return true if player should leave room, false if leave attempt should be ignored
	onLeave?: (player: Player) => void;
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
	public hub: RoomHub | null;
	private _beforeJoin: ((player: Player) => Promise<boolean>) | null;
	private _onJoin: ((player: Player) => void) | null;
	private _beforeLeave: ((player: Player) => Promise<boolean>) | null;
	private _onLeave: ((player: Player) => void) | null;

	public constructor(config: RoomConfig) {
		this.dimensionId = config.dimensionId;
		this.roomTypeIndex = config.roomTypeIndex;
		this.roomIndex = config.roomIndex;
		this.displayName = config.displayName;
		this.icon = config.icon ?? "";
		this.structures = config.structures ?? [];
		this._spawn = config.spawn;
		if (config.hub === undefined) {
			this.hub = null;
		} else {
			this.hub = new RoomHub(
				this.dimensionId,
				config.spawn,
				config.hub.onJoin,
				config.hub.onLeave,
			);
		}
		this._beforeJoin = config.beforeJoin ?? null;
		this._onJoin = config.onJoin ?? null;
		this._beforeLeave = config.beforeLeave ?? null;
		this._onLeave = config.onLeave ?? null;
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
		if (this._dimension === undefined) {
			return;
		}
		if (this._beforeJoin !== null) {
			const result: boolean = await this._beforeJoin(player);
			if (!result) {
				return;
			}
		}
		const previousRoom: Room | null = getPlayerRoom(player);
		if (previousRoom !== null) {
			previousRoom.leave(player);
		}
		if (this.hub?.isActive) {
			this.hub.join(player);
		} else {
			player.teleport(this._spawn, { dimension: this._dimension });
			portalSoundRunInterval(player);
			player.setSpawnPoint({
				dimension: this._dimension,
				x: this._spawn.x,
				y: this._spawn.y,
				z: this._spawn.z,
			});
		}
		if (previousRoom === null || previousRoom.dimensionId !== this.dimensionId) {
			player.sendMessage(`§7Joined: ${this.displayName}`);
		}
		if (this._onJoin !== null) {
			this._onJoin(player);
		}
	}

	public async leave(player: Player): Promise<void> {
		if (this._beforeLeave !== null) {
			const result: boolean = await this._beforeLeave(player);
			if (!result) {
				return;
			}
		}
		if (this._onLeave !== null) {
			this._onLeave(player);
		}
		if (this.hub?.isActive) {
			this.hub.leave(player);
		}
		system.run(() => {
			// If i dont do this, player is teleported to the mount location in the new dimension for some reason
			ejectFromMount(player);
		});
		this.removePlayer(player);
	}

	// doesnt run any beforeLeave callback or teleportation
	public removePlayer(player: Player): void {
		if (this.hub !== null) {
			this.hub.removePlayer(player);
		}
		portalSoundRunIntervalClear(player);
		projectileTrackerRemoveProjectiles(player);
		killTrackerRemovePlayer(player);
		clearPlayerCooldowns(player);
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
Includes Hub: §e${this.hub !== null}§r
Projectile Tracker: §e${projectileTrackerHasDimension(this.dimensionId)}§r
Kill Tracker: §e${killTrackerHasDimension(this.dimensionId)}§r
`.trim();
	}
}
