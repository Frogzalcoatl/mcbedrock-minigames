import { type Player, system, world } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import type { Room } from "./room";
import { roomTypes } from "./roomManager";
import type { RoomType } from "./roomType";

async function showRoomStructures(player: Player, room: Room, roomType: RoomType): Promise<void> {
	const form = new ActionFormData();
	form.title(`§0${room.displayName} Structures`);
	form.button("Back");
	const backButtonIndex: number = 0;
	form.button("Load All");
	form.divider();
	const allButtonIndex: number = 1;
	const structureButtonsStartingIndex: number = 2;
	for (const s of room.structures) {
		form.button(`${s.id}`);
	}
	const resp: ActionFormResponse = await form.show(player);
	if (resp.selection === undefined || resp.selection === backButtonIndex) {
		system.run(() => showRoomInfo(player, room, roomType));
		return;
	}
	if (resp.selection === allButtonIndex) {
		room.loadStructure("all");
		world.sendMessage(`Queued structure loading for all structures in: ${room.displayName}`);
	} else {
		const selectedStructureIndex: number = resp.selection - structureButtonsStartingIndex;
		room.loadStructure(selectedStructureIndex);
		world.sendMessage(
			`Queued structure loading for "${room.structures[selectedStructureIndex]?.id}" in: ${room.displayName}`,
		);
	}
}

async function showRoomInfo(player: Player, room: Room, roomType: RoomType): Promise<void> {
	if (!player.isValid) {
		return;
	}
	const form = new ActionFormData();
	form.title(`§0${room.displayName}`);
	form.body(room.info());
	form.divider();
	form.button("Back");
	const backButtonIndex: number = 0;
	form.button("Join");
	form.button("Load Structures");
	form.divider();
	const joinButtonIndex: number = 1;
	const structuresButtonIndex: number = 2;
	const resp: ActionFormResponse = await form.show(player);
	if (resp.selection === undefined || resp.selection === backButtonIndex) {
		if (roomType.rooms.length === 1) {
			showRoomsForm(player);
		} else {
			showRoomTypeRoomsForm(player, roomType);
		}
		return;
	}
	if (resp.selection === joinButtonIndex) {
		room.join(player);
	} else if (resp.selection === structuresButtonIndex) {
		system.run(() => showRoomStructures(player, room, roomType));
	}
}

async function showRoomsGeneral(player: Player): Promise<void> {
	const form = new ActionFormData();
	form.title("§0Room Management");
	form.button("Back");
	const backButtonIndex: number = 0;
	form.button("Load All Structures");
	const loadAllIndex: number = 1;
	const resp: ActionFormResponse = await form.show(player);
	if (resp.selection === undefined || resp.selection === backButtonIndex) {
		system.run(() => showRoomsForm(player));
		return;
	}
	if (resp.selection === loadAllIndex) {
		for (const type of roomTypes) {
			for (const room of type.rooms) {
				room.loadStructure("all");
			}
		}
		world.sendMessage("Queued structure loading in every room");
	}
}

async function showRoomTypeRoomsForm(player: Player, roomType: RoomType): Promise<void> {
	if (roomType.rooms.length === 1) {
		const room: Room | undefined = roomType.rooms[0];
		if (room !== undefined) {
			showRoomInfo(player, room, roomType);
		}
		return;
	}
	const form = new ActionFormData();
	form.title(`§0Manage ${roomType.displayName} Rooms`);
	form.button("Back");
	const backButtonIndex: number = 0;
	const roomsStartingIndex: number = 1;
	for (const room of roomType.rooms) {
		form.button(room.displayName, room.icon);
	}
	const resp: ActionFormResponse = await form.show(player);
	if (resp.selection === undefined || !player.isValid) {
		return;
	}
	if (resp.selection === backButtonIndex) {
		showRoomsForm(player);
		return;
	}
	const room: Room | undefined = roomType.rooms[resp.selection - roomsStartingIndex];
	if (room !== undefined) {
		showRoomInfo(player, room, roomType);
	}
}

export async function showRoomsForm(player: Player): Promise<void> {
	if (!player.isValid) {
		return;
	}
	const form = new ActionFormData();
	form.title("§0Room Management");
	form.button("General", "textures/ui/settings_glyph_color_2x.png");
	const generalButtonIndex: number = 0;
	const roomTypesStartingIndex: number = 1;
	for (const type of roomTypes) {
		form.button(type.displayName, type.icon);
	}
	const resp: ActionFormResponse = await form.show(player);
	if (resp.selection === undefined || !player.isValid) {
		return;
	}
	if (resp.selection === generalButtonIndex) {
		system.run(() => showRoomsGeneral(player));
		return;
	}
	const roomType: RoomType | undefined = roomTypes[resp.selection - roomTypesStartingIndex];
	if (roomType !== undefined) {
		showRoomTypeRoomsForm(player, roomType);
	}
}
