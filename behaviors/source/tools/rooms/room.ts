import {
	type Dimension,
	type DimensionLocation,
	type DimensionRegistry,
	type Player,
	type PlayerDimensionChangeAfterEvent,
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
import { killTrackerHasDimension } from "../trackers/killTracker";
import { projectileTrackerHasDimension } from "../trackers/projectileTracker";
import { RoomHub } from "./roomHub";
import { getPlayerRoom } from "./roomManager";

const dynamicPropertyDimTransfer: string = "transferring_dimension_on_join";

// Both setRotation and facing parameter of teleport are ignored during dimension transfer
// Wait until the player has finished transferring then teleport them again,
// only if they transferred due to a room join.
// (Don't teleport players who are simply using a nether portal or smth)
world.afterEvents.playerDimensionChange.subscribe((event: PlayerDimensionChangeAfterEvent) => {
	event.player.stopSound("portal.travel");
	if (event.player.getDynamicProperty(dynamicPropertyDimTransfer) === undefined) {
		return;
	}
	event.player.setDynamicProperty(dynamicPropertyDimTransfer);
	const room: Room | null = getPlayerRoom(event.player);
	if (room !== null) {
		const spawn: TeleportLocation = room.hub !== null ? room.hub.spawn : room.spawn;
		event.player.teleport(spawn.pos, { facingLocation: spawn.facing });
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
	includeHub: boolean;
	roomIndex: number;
	roomTypeIndex: number;
	spawn: TeleportLocation;
	structures?: RoomStructure[];
}

export class Room {
	public readonly dimensionId: string;
	public readonly roomTypeIndex: number;
	public readonly roomIndex: number;
	public displayName: string;
	public icon: string;
	public readonly structures: RoomStructure[];
	// Return true if join attempt should be ignored
	public beforeJoin: ((player: Player) => boolean) | null;
	public onJoin: EventSignal<PlayerEvent>;
	// Leave events still triggered when player.isValid is false
	public onLeave: EventSignal<PlayerEvent>;
	public hub: RoomHub | null;
	private _spawn: TeleportLocation;
	private _dimension: Dimension | undefined;

	public constructor(config: RoomConfig) {
		this.dimensionId = config.dimensionId;
		this.roomTypeIndex = config.roomTypeIndex;
		this.roomIndex = config.roomIndex;
		this.displayName = config.displayName;
		this.icon = config.icon ?? "";
		this.structures = config.structures ?? [];
		if (config.includeHub) {
			this.hub = new RoomHub(this.dimensionId, config.spawn);
		} else {
			this.hub = null;
		}
		this._spawn = config.spawn;
		this.beforeJoin = null;
		this.onJoin = new EventSignal<PlayerEvent>();
		this.onLeave = new EventSignal<PlayerEvent>();
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

	public join(player: Player): void {
		if (this._dimension === undefined || (this.beforeJoin !== null && !this.beforeJoin(player))) {
			return;
		}
		const previousRoom: Room | null = getPlayerRoom(player);
		if (previousRoom !== null) {
			previousRoom.leave(player);
			if (previousRoom.dimensionId !== this.dimensionId) {
				player.setDynamicProperty(dynamicPropertyDimTransfer, true);
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
		if (previousRoom === null || previousRoom.dimensionId !== this.dimensionId) {
			player.sendMessage(`§7Joined: ${this.displayName}`);
		}
		const event: PlayerEvent = {
			player: player,
		};
		this.onJoin.triggerEvent(event);
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
Room Index: §e${this.roomIndex}§r
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
