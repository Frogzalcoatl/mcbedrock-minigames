import { type Player, system, world } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import type { Room } from "./room";
import { rooms, roomTypes } from "./roomManager";

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

async function showRoomStructures(player: Player, room: Room): Promise<void> {
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
		system.run(() => showRoomInfo(player, room));
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

async function showRoomInfo(player: Player, room: Room): Promise<void> {
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
		showRoomsForm(player);
		return;
	}
	if (resp.selection === joinButtonIndex) {
		room.join(player);
	} else if (resp.selection === structuresButtonIndex) {
		system.run(() => showRoomStructures(player, room));
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
	const roomButtonsStartingIndex: number = 1;
	for (const room of rooms) {
		form.button(room.displayName, room.icon);
	}
	const resp: ActionFormResponse = await form.show(player);
	if (resp.selection === undefined || !player.isValid) {
		return;
	}
	if (resp.selection === generalButtonIndex) {
		system.run(() => showRoomsGeneral(player));
		return;
	}
	const room: Room | undefined = rooms[resp.selection - roomButtonsStartingIndex];
	if (room === undefined) {
		return;
	}
	showRoomInfo(player, room);
}
