import { type Entity, system } from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
import { PACK_NAMESPACE } from "../constants";
import typeNames from "../roomTypeNames";
import type { Room } from "./room";
import { getRoomHub } from "./types/hub";
import { getRoomKitPvp } from "./types/kitPvp";
import { initRoomType, type RoomType } from "./types/roomType";

export const roomTypes: RoomType[] = [];
export const rooms: Room[] = [];

export const playerRoomTracker = new Map<string, number>(); // [playerId, roomIndex]

system.beforeEvents.startup.subscribe((e) => {
	roomTypes.push(initRoomType(typeNames.hub, MinecraftDimensionTypes.Overworld, getRoomHub, 1));
	roomTypes.push(initRoomType(typeNames.kitPvp, `${PACK_NAMESPACE}:kitpvp`, getRoomKitPvp, 2));
	for (const type of roomTypes) {
		for (const room of type.rooms) {
			room.registerDimension(e.dimensionRegistry);
			rooms.push(room);
		}
	}
});

export function joinRoomType(entity: Entity, typeName: string, roomIndex: number = 0): void {
	for (const type of roomTypes) {
		if (type.typeName !== typeName) {
			continue;
		}
		const room: Room | undefined = type.rooms[roomIndex];
		if (room !== undefined) {
			room.join(entity);
		}
	}
}

export function getEntityRoom(entity: Entity): Room | null {
	const roomIndex: number | undefined = playerRoomTracker.get(entity.id);
	if (roomIndex === undefined) {
		return null;
	}
	return rooms[roomIndex] ?? null;
}
