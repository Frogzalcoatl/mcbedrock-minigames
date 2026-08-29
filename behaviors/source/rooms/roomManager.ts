import { GameMode, type Player, PlayerPermissionLevel, system, world } from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
import { PACK_NAMESPACE } from "../constants";
import { getRoomKitPvp } from "../games/kitPvp";
import { getRoomHub } from "../games/mainHub";
import roomTypeIds from "../roomTypeIds";
import type { Room } from "./room";
import { initRoomType, type RoomType } from "./roomType";

export const roomTypes: RoomType[] = [];
export const rooms = new Map<string, Room>(); // [DimensionId, Room]

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
			roomCount: 1,
			roomCreationFunc: getRoomKitPvp,
			roomTypeIndex: 1,
			typeId: roomTypeIds.kitPvp,
		}),
	);
	for (const type of roomTypes) {
		for (const room of type.rooms) {
			room.registerDimension(e.dimensionRegistry);
			rooms.set(room.dimensionId, room);
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
		break;
	}
}

export function getPlayerRoom(player: Player): Room | null {
	return rooms.get(player.dimension.id) ?? null;
}

world.afterEvents.worldLoad.subscribe(() => {
	const hubRoomType: RoomType | undefined = roomTypes.find((t) => t.typeId === roomTypeIds.hub);
	if (hubRoomType === undefined) {
		return;
	}
	const mainHub: Room | undefined = hubRoomType.rooms[0];
	if (mainHub === undefined) {
		return;
	}
	for (const p of world.getAllPlayers()) {
		if (
			p.playerPermissionLevel === PlayerPermissionLevel.Operator &&
			p.getGameMode() === GameMode.Creative
		) {
			// Dont teleport contributors to hub on reload
			continue;
		}
		mainHub.join(p);
	}
});

world.beforeEvents.playerLeave.subscribe((event) => {
	const room: Room | null = getPlayerRoom(event.player);
	if (room !== null) {
		room.removePlayer(event.player);
	}
});
