import { type Entity, system } from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
import { getRoomKitPvp } from "../games/kitPvp/room";
import { getRoomHub } from "../hub";
import { KITPVP_DIMENSION_ID } from "./dimensionIds";
import type { Room } from "./room";

export const rooms: Room[] = [];

export const playerRoomTracker = new Map<string, number>(); // [playerId, roomIndex]

system.beforeEvents.startup.subscribe((e) => {
	rooms.push(getRoomHub(0, MinecraftDimensionTypes.Overworld));
	rooms.push(getRoomKitPvp(1, KITPVP_DIMENSION_ID));
	for (const room of rooms) {
		room.registerDimension(e.dimensionRegistry);
	}
});

export function joinRoom(entity: Entity, dimensionId: string): void {
	for (const room of rooms) {
		if (room.dimensionId === dimensionId) {
			room.join(entity);
			return;
		}
	}
}
