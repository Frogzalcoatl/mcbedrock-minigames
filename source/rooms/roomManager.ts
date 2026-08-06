import { GameMode, type Player, PlayerPermissionLevel, system, world } from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
import { PACK_NAMESPACE } from "../constants";
import { getRoomKitPvp } from "../games/kitPvp/room";
import roomTypeIds from "../roomTypeIds";
import type { Room } from "./room";
import { getRoomHub } from "./types/hub";
import { initRoomType, type RoomType } from "./types/roomType";

export const roomTypes: RoomType[] = [];
export const rooms: Room[] = [];

export const playerRoomTracker = new Map<string, [number, number]>(); // [playerId, [roomTypeIndex, roomIndex]]

system.beforeEvents.startup.subscribe((e) => {
	roomTypes.push(
		initRoomType({
			defaultDimensionId: MinecraftDimensionTypes.Overworld,
			displayName: "Hub",
			icon: "textures/items/ender_eye.png",
			roomCount: 1,
			roomCreationFunc: getRoomHub,
			roomTypeIndex: 0,
			typeId: roomTypeIds.hub,
		}),
	);
	roomTypes.push(
		initRoomType({
			defaultDimensionId: `${PACK_NAMESPACE}:kitpvp`,
			displayName: "Kit Pvp",
			icon: "textures/items/diamond_sword.png",
			roomCount: 2,
			roomCreationFunc: getRoomKitPvp,
			roomTypeIndex: 1,
			typeId: roomTypeIds.kitPvp,
		}),
	);
	for (const type of roomTypes) {
		for (const room of type.rooms) {
			room.registerDimension(e.dimensionRegistry);
			rooms.push(room);
		}
	}
});

export function joinRoomType(player: Player, typeId: string, roomIndex: number = 0): void {
	for (const type of roomTypes) {
		if (type.typeId !== typeId) {
			continue;
		}
		const room: Room | undefined = type.rooms[roomIndex];
		if (room !== undefined) {
			room.join(player);
		}
	}
}

export function getPlayerRoom(player: Player): Room | null {
	const entry: [number, number] | undefined = playerRoomTracker.get(player.id);
	if (entry === undefined) {
		return null;
	}
	return roomTypes[entry[0]]?.rooms[entry[1]] ?? null;
}

world.afterEvents.worldLoad.subscribe(() => {
	for (const p of world.getAllPlayers()) {
		if (!p.isValid) {
			continue;
		}
		if (
			p.playerPermissionLevel === PlayerPermissionLevel.Operator &&
			p.getGameMode() === GameMode.Creative
		) {
			// Dont teleport contributors to hub on reload
			const room: Room | undefined = rooms.find((r) => r.dimensionId === p.dimension.id);
			if (room === undefined) {
				continue;
			}
			room.addPlayer(p);
		} else {
			joinRoomType(p, roomTypeIds.hub);
		}
	}
});
