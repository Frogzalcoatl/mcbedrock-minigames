import {
	type Dimension,
	type DimensionLocation,
	type DimensionRegistry,
	type Player,
	type PlayerDimensionChangeAfterEvent,
	type PlayerLeaveBeforeEvent,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import { loadStructure } from "../../structures/load";
import {
	EventSignal,
	type PlayerEvent,
	type TeleportLocation,
	teleportLocationToString,
} from "../../types";
import { ejectFromMount } from "../mount";
import { dimensionTracker } from "../trackers/dimensionTracker";
import { killTrackerHasDimension } from "../trackers/killTracker";
import { projectileTrackerHasDimension } from "../trackers/projectileTracker";
import type { RoomHub } from "./roomHub";

const dynamicPropertyRoomTransfer: string = "transferring_room";

// setRotation and facing parameter of teleport are ignored during dimension transfer
// rotate players after they finish transferring dimensions instead
// Additionally trigger room.join for players who transferred dimensions through /tp
world.afterEvents.playerDimensionChange.subscribe((event: PlayerDimensionChangeAfterEvent) => {
	event.player.stopSound("portal.travel");
	const triggeredByRoomTransfer: boolean =
		event.player.getDynamicProperty(dynamicPropertyRoomTransfer) !== undefined;
	event.player.setDynamicProperty(dynamicPropertyRoomTransfer, undefined);
	const newRoom: Room | undefined = Room.get(event.toDimension.id);
	if (newRoom === undefined) {
		return;
	}
	if (triggeredByRoomTransfer) {
		// Set rotation after player has transferred dimensions
		let spawn: TeleportLocation;
		if (newRoom.hub?.isActive) {
			spawn = newRoom.hub.spawn;
		} else {
			spawn = newRoom.spawn;
		}
		event.player.teleport(spawn.pos, { facingLocation: spawn.facing });
	} else {
		// Joined through /tp, maintain position teleported to
		const previousRoom: Room | undefined = Room.get(event.fromDimension.id);
		const teleportLocation: Vector3 = Object.create(event.player.location);
		newRoom.join(event.player, previousRoom);
		event.player.teleport(teleportLocation);
	}
});

world.beforeEvents.playerLeave.subscribe((event: PlayerLeaveBeforeEvent) => {
	// player.dimension is not accessible in this event as of 1.26.50
	const playerDimension: Dimension | null = dimensionTracker(event.player.id);
	if (playerDimension === null) {
		return;
	}
	const room: Room | undefined = Room.get(playerDimension.id);
	if (room !== undefined) {
		system.run(() => room.leave(event.player));
	}
});

export interface RoomStructure {
	id: string;
	pos: Vector3;
}

export interface RoomConfig {
	dimensionId: string;
	displayName: string;
	icon: string;
	spawn: TeleportLocation;
	structures?: RoomStructure[];
}

export class Room {
	private static _rooms = new Map<string, Room>(); // key is dimensionId

	public static get(dimensionId: string): Room | undefined {
		return Room._rooms.get(dimensionId);
	}

	public static findPlayer(player: Player): Room | undefined {
		return Room._rooms.get(player.dimension.id);
	}

	// Should be called after all room instances are initialized
	public static init(dimensionRegistry: DimensionRegistry): void {
		for (const [, room] of Room._rooms) {
			room.registerDimension(dimensionRegistry);
		}
	}

	public readonly dimensionId: string;
	public displayName: string;
	public icon: string;
	public readonly structures: RoomStructure[];
	// Return false if join attempt should be ignored
	public beforeJoin: ((player: Player) => boolean) | null;
	public onJoin: EventSignal<PlayerEvent>;
	// Leave events still triggered when player.isValid is false
	public onLeave: EventSignal<PlayerEvent>;
	public hub: RoomHub | null;
	private _spawn: TeleportLocation;
	private _dimension: Dimension | undefined;

	public constructor(config: RoomConfig) {
		this.dimensionId = config.dimensionId;
		this.displayName = config.displayName;
		this.icon = config.icon ?? "";
		this.structures = config.structures ?? [];
		this.hub = null;
		this._spawn = config.spawn;
		this.beforeJoin = null;
		this.onJoin = new EventSignal<PlayerEvent>();
		this.onLeave = new EventSignal<PlayerEvent>();
		Room._rooms.set(this.dimensionId, this);
	}

	public get dimension(): Dimension | undefined {
		return this._dimension;
	}

	public get playerCount(): number | null {
		return this._dimension?.getPlayers().length ?? null;
	}

	public get spawn(): TeleportLocation {
		return this._spawn;
	}

	public set spawn(val: TeleportLocation) {
		this._spawn = val;
		if (this._dimension === undefined) {
			return;
		}
		const location: DimensionLocation = {
			dimension: this._dimension,
			x: val.pos.x,
			y: val.pos.y,
			z: val.pos.z,
		};
		for (const player of this._dimension.getPlayers()) {
			if (this.hub?.has(player)) {
				continue;
			}
			player.setSpawnPoint(location);
		}
	}

	public registerDimension(dimensionRegistry: DimensionRegistry): void {
		if (!this.dimensionId.startsWith("minecraft:")) {
			dimensionRegistry.registerCustomDimension(this.dimensionId);
		}
		system.run(() => {
			this._dimension = world.getDimension(this.dimensionId);
		});
	}

	public join(player: Player, previousRoom?: Room): boolean {
		if (this._dimension === undefined || (this.beforeJoin !== null && !this.beforeJoin(player))) {
			return false;
		}
		if (previousRoom === undefined) {
			previousRoom = Room.findPlayer(player);
		}
		if (previousRoom !== undefined) {
			previousRoom.leave(player);
			if (previousRoom.dimensionId !== this.dimensionId) {
				player.setDynamicProperty(dynamicPropertyRoomTransfer, true);
			}
		}
		if (this.hub?.isActive) {
			this.hub.join(player);
		} else {
			player.teleport(this._spawn.pos, {
				dimension: this._dimension,
				facingLocation: this._spawn.facing,
			});
			player.setSpawnPoint({
				dimension: this._dimension,
				x: this._spawn.pos.x,
				y: this._spawn.pos.y,
				z: this._spawn.pos.z,
			});
		}
		if (previousRoom === undefined || previousRoom.dimensionId !== this.dimensionId) {
			player.sendMessage(`§7Joined: ${this.displayName}`);
		}
		const event: PlayerEvent = {
			player: player,
		};
		this.onJoin.triggerEvent(event);
		return true;
	}

	public leave(player: Player): void {
		const event: PlayerEvent = {
			player: player,
		};
		this.onLeave.triggerEvent(event);
		if (this.hub?.isActive) {
			this.hub.leave(player);
		}
		if (player.isValid) {
			ejectFromMount(player); // If i dont do this, player is teleported to the mount location in the new dimension for some reason
		}
		if (this.hub !== null) {
			this.hub.leave(player);
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
Display Name: §e${this.displayName}§r
Icon: §e${this.icon}§r
Player Count: §e${this.playerCount}§r
Spawn: §e${teleportLocationToString(this._spawn)}§r
Saved Structures: §e${this.structures.length}§r
Includes Hub: §e${this.hub !== null}§r
Projectile Tracker: §e${projectileTrackerHasDimension(this.dimensionId)}§r
Kill Tracker: §e${killTrackerHasDimension(this.dimensionId)}§r
`.trim();
	}
}
