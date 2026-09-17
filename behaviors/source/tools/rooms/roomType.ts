import {
	type DimensionRegistry,
	GameMode,
	type Player,
	PlayerPermissionLevel,
	type PlayerSpawnAfterEvent,
	type StartupEvent,
	system,
	world,
} from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import { PACK_NAMESPACE, roomTypeIds } from "../../constants";
import { safeActionFormShow } from "../../forms/safeShow";
import type { Room } from "./room";

system.beforeEvents.startup.subscribe((event: StartupEvent) => {
	RoomType.registerAll(event.dimensionRegistry);
});

world.afterEvents.worldLoad.subscribe(() => {
	const hubRoomType: RoomType | undefined = RoomType.get(roomTypeIds.hub);
	if (hubRoomType === undefined) {
		return;
	}
	for (const p of world.getAllPlayers()) {
		if (
			p.playerPermissionLevel === PlayerPermissionLevel.Operator &&
			p.getGameMode() === GameMode.Creative
		) {
			continue;
		}
		hubRoomType.join(p);
	}
});

world.afterEvents.playerSpawn.subscribe((event: PlayerSpawnAfterEvent) => {
	if (!event.initialSpawn) {
		return;
	}
	const hubRoomType: RoomType | undefined = RoomType.get(roomTypeIds.hub);
	if (hubRoomType !== undefined) {
		hubRoomType.join(event.player);
	}
});

export type RoomCreatorFunc = (dimensionId: string, displayName: string, icon: string) => Room;

export interface RoomTypeConfig {
	defaultDimensionId: string;
	displayName: string;
	icon?: string;
	roomCount: number;
	roomCreatorFunc: RoomCreatorFunc;
	typeId: string;
}

export class RoomType {
	private static _types: RoomType[] = [];
	private static _dimensionMap = new Map<string, RoomType>(); // key is dimensionId

	public static get(typeId: string): RoomType | undefined {
		return RoomType._types.find((t) => t.typeId === typeId);
	}

	public static getAll(): RoomType[] {
		return RoomType._types;
	}

	public static findPlayer(player: Player): RoomType | undefined {
		return RoomType._dimensionMap.get(player.dimension.id);
	}

	public static findDimension(dimensionId: string): RoomType | undefined {
		return RoomType._dimensionMap.get(dimensionId);
	}

	public static registerAll(dimensionRegistry: DimensionRegistry): void {
		for (const type of RoomType._types) {
			for (const room of type._rooms) {
				room.registerDimension(dimensionRegistry);
			}
		}
	}

	public typeId: string;
	public displayName: string;
	public icon: string;
	private _rooms: Room[];

	public constructor(config: RoomTypeConfig) {
		this.typeId = config.typeId;
		this.displayName = config.displayName;
		this.icon = config.icon ?? "";
		this._rooms = [];
		RoomType._types.push(this);
		if (config.roomCount < 1) {
			return;
		}
		if (!config.defaultDimensionId.startsWith("minecraft:")) {
			for (let i = 0; i < config.roomCount; i++) {
				const room: Room = config.roomCreatorFunc(
					`${config.defaultDimensionId}-${i + 1}`,
					`${this.displayName} ${i + 1}`,
					this.icon,
				);
				RoomType._dimensionMap.set(room.dimensionId, this);
				this._rooms.push(room);
			}
			return;
		}
		const firstRoom: Room = config.roomCreatorFunc(
			config.defaultDimensionId,
			`${this.displayName} 1`,
			this.icon,
		);
		RoomType._dimensionMap.set(firstRoom.dimensionId, this);
		this._rooms.push(firstRoom);
		if (config.roomCount === 1) {
			return;
		}
		const colonIndex: number = config.defaultDimensionId.indexOf(":");
		const customDimensionId: string = `${PACK_NAMESPACE}:${config.defaultDimensionId.slice(colonIndex + 1)}`;
		for (let i = 1; i < config.roomCount; i++) {
			const room: Room = config.roomCreatorFunc(
				`${customDimensionId}-${i + 1}`,
				`${this.displayName} ${i + 1}`,
				this.icon,
			);
			RoomType._dimensionMap.set(room.dimensionId, this);
			this._rooms.push(room);
		}
	}

	public get rooms(): Room[] {
		return this._rooms;
	}

	public join(player: Player, roomIndex = 0): boolean {
		const room: Room | undefined = this._rooms[roomIndex];
		return room?.join(player) ?? false;
	}

	// Returns true if player selected a room
	public async form(player: Player): Promise<boolean> {
		const form = new ActionFormData();
		form.title(`§0${this.displayName} Rooms`);
		for (const room of this._rooms) {
			form.button(room.displayName, room.icon);
		}
		const resp: ActionFormResponse = await safeActionFormShow(form, player);
		if (!player.isValid || resp.selection === undefined) {
			return false;
		}
		const selectedRoom: Room | undefined = this._rooms[resp.selection];
		if (selectedRoom === undefined) {
			player.sendMessage("§cUnable to find selected room");
			return false;
		}
		selectedRoom.join(player);
		return true;
	}
}
