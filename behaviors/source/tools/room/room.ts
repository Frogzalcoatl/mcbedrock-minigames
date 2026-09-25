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
import { EventSignal, type TeleportLocation, teleportLocationToString } from "../../types";
import { ejectFromMount } from "../actions/mount";
import { dimensionTracker } from "../trackers/dimensionTracker";
import { killTrackerHasDimension } from "../trackers/killTracker";
import { projectileTrackerHasDimension } from "../trackers/projectileTracker";
import type { LocalHub } from "./localHub";
import { isInitialSpawnTransfer } from "./roomType";

// Rotation is not accessible before or during dimension change, so we teleport players facing the proper direction after.
// If a player is teleported using /tp, Room.join is run and their teleported position is maintained.
// A room transfer is triggered on initialSpawn in roomType.ts.
// With my implementation, this would be incorrectly recognized as a /tp dimension change and trigger a leave event in the dimension the player was on before last leaving the world.
// To avoid this, we detect it using a dynamic property set on initial spawn.

const propertyRoomTransfer: string = "transferring_room";

world.afterEvents.playerDimensionChange.subscribe((event: PlayerDimensionChangeAfterEvent) => {
	event.player.stopSound("portal.travel");

	const triggeredByRoomTransfer: boolean =
		event.player.getDynamicProperty(propertyRoomTransfer) !== undefined;
	event.player.setDynamicProperty(propertyRoomTransfer, undefined);
	const isInitialSpawn: boolean = isInitialSpawnTransfer(event.player);

	const newRoom: Room | undefined = Room.get(event.toDimension.id);
	if (newRoom === undefined) {
		return;
	}

	if (triggeredByRoomTransfer || isInitialSpawn) {
		// Set rotation after player has changed dimensions
		let spawn: TeleportLocation;
		if (newRoom.localHub?.isActive) {
			spawn = newRoom.localHub.spawn;
		} else {
			spawn = newRoom.spawn;
		}
		event.player.teleport(spawn.pos, { facingLocation: spawn.facing });
		return;
	}

	// Joined from /tp. Maintain teleported position and run join/leave callbacks
	const previousRoom: Room | undefined = Room.get(event.fromDimension.id);
	const teleportLocation: Vector3 = Object.create(event.player.location);
	newRoom.join(event.player, previousRoom, true);
	event.player.setDynamicProperty(propertyRoomTransfer, undefined);
	event.player.teleport(teleportLocation);
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

export interface RoomBeforeJoinEvent {
	cancel: boolean;
	player: Player;
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
	public readonly beforeJoin: EventSignal<RoomBeforeJoinEvent>;
	public readonly onJoin: EventSignal<Player>;
	// Leave events still triggered when player.isValid is false
	public readonly onLeave: EventSignal<Player>;
	public localHub: LocalHub | null;
	private _spawn: TeleportLocation;
	private _dimension: Dimension | undefined;

	public constructor(config: RoomConfig) {
		this.dimensionId = config.dimensionId;
		this.displayName = config.displayName;
		this.icon = config.icon ?? "";
		this.structures = config.structures ?? [];
		this.localHub = null;
		this._spawn = config.spawn;
		this.beforeJoin = new EventSignal<RoomBeforeJoinEvent>();
		this.onJoin = new EventSignal<Player>();
		this.onLeave = new EventSignal<Player>();
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
			if (this.localHub?.has(player)) {
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

	public join(player: Player, previousRoom?: Room, ignoreBeforeJoin = false): boolean {
		if (this._dimension === undefined) {
			return false;
		}
		if (!ignoreBeforeJoin) {
			const beforeJoinEvent: RoomBeforeJoinEvent = {
				cancel: false,
				player: player,
			};
			this.beforeJoin.triggerEvent(beforeJoinEvent);
			if (beforeJoinEvent.cancel) {
				return false;
			}
		}
		if (previousRoom === undefined) {
			previousRoom = Room.findPlayer(player);
		}
		if (previousRoom !== undefined) {
			previousRoom.leave(player);
			if (previousRoom.dimensionId !== this.dimensionId) {
				player.setDynamicProperty(propertyRoomTransfer, true);
			}
		}
		if (this.localHub?.isActive) {
			this.localHub.join(player);
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
		this.onJoin.triggerEvent(player);
		return true;
	}

	public leave(player: Player): void {
		if (player.isValid) {
			ejectFromMount(player); // If i dont do this, player is teleported to their mount's location in the new dimension for some reason
		}
		if (this.localHub?.isActive) {
			this.localHub.leave(player);
		}
		this.onLeave.triggerEvent(player);
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
Includes Hub: §e${this.localHub !== null}§r
Projectile Tracker: §e${projectileTrackerHasDimension(this.dimensionId)}§r
Kill Tracker: §e${killTrackerHasDimension(this.dimensionId)}§r
`.trim();
	}
}
