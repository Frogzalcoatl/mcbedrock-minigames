import { type Player, system, world } from "@minecraft/server";
import {
	ActionFormData,
	type ActionFormResponse,
	FormRejectError,
	MessageFormData,
	type MessageFormResponse,
} from "@minecraft/server-ui";
import type { Room, RoomStructure } from "./room";
import { roomTypes } from "./roomManager";
import type { RoomType } from "./roomType";

// if structureId undefined, assumes
async function showLoadConfirmation(
	player: Player,
	room: Room,
	roomType: RoomType,
	selectedStructureIndex: number | "all",
): Promise<void> {
	let selectedStructureName: string;
	if (selectedStructureIndex === "all") {
		selectedStructureName = "all structures";
	} else {
		const selectedStructure: RoomStructure | undefined =
			room.structures[selectedStructureIndex];
		if (selectedStructure === undefined) {
			player.sendMessage("§cInvalid Structure.");
			return;
		}
		selectedStructureName = selectedStructure.id;
	}
	const form = new MessageFormData();
	form.title(`§0Structure Loading`);
	form.body(`Are you sure you want to load "${selectedStructureName}" for ${room.displayName}?`);
	form.button1("I'm Sure!");
	form.button2("Cancel");
	let resp: MessageFormResponse;
	try {
		resp = await form.show(player);
	} catch (error) {
		if (error instanceof FormRejectError) {
			return;
		} else {
			throw error;
		}
	}
	if (resp.selection === undefined || resp.selection === 1) {
		system.run(() => showRoomStructures(player, room, roomType));
	} else if (resp.selection === 0) {
		room.loadStructure(selectedStructureIndex);
		world.sendMessage(
			`Queued structure loading for "${selectedStructureName}" in: ${room.displayName}`,
		);
	}
}

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
	let resp: ActionFormResponse;
	try {
		resp = await form.show(player);
	} catch (error) {
		if (error instanceof FormRejectError) {
			return;
		} else {
			throw error;
		}
	}
	if (resp.selection === undefined || resp.selection === backButtonIndex) {
		system.run(() => showRoomInfo(player, room, roomType));
		return;
	}
	if (resp.selection === allButtonIndex) {
		system.run(() => showLoadConfirmation(player, room, roomType, "all"));
	} else {
		const selectedStructureIndex: number = resp.selection - structureButtonsStartingIndex;
		system.run(() => showLoadConfirmation(player, room, roomType, selectedStructureIndex));
	}
}

async function showRoomInfo(player: Player, room: Room, roomType: RoomType): Promise<void> {
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
	let resp: ActionFormResponse;
	try {
		resp = await form.show(player);
	} catch (error) {
		if (error instanceof FormRejectError) {
			return;
		} else {
			throw error;
		}
	}
	if (resp.selection === undefined || resp.selection === backButtonIndex) {
		if (roomType.rooms.length === 1) {
			system.run(() => showFormSettings(player));
		} else {
			system.run(() => showRoomType(player, roomType));
		}
		return;
	}
	if (resp.selection === joinButtonIndex) {
		room.join(player);
	} else if (resp.selection === structuresButtonIndex) {
		system.run(() => showRoomStructures(player, room, roomType));
	}
}

async function loadAllStructuresConfirmation(player: Player): Promise<void> {
	const form = new MessageFormData();
	form.title("§0Load all structures");
	form.body(
		"Are you sure you want to queue structure loading for EVERY dimension? This should only be run at the start of a new world. You can load structures for individual dimensions by going back and choosing a specific room.",
	);
	form.button1("I'm Sure");
	form.button2("Cancel");
	let resp: MessageFormResponse;
	try {
		resp = await form.show(player);
	} catch (error) {
		if (error instanceof FormRejectError) {
			return;
		} else {
			throw error;
		}
	}
	if (resp.selection === undefined) {
		system.run(() => showGeneral(player));
	}
	if (resp.selection === 0) {
		for (const type of roomTypes) {
			for (const room of type.rooms) {
				room.loadStructure("all");
			}
		}
		world.sendMessage("Queued structure loading in every room");
	} else {
	}
}

async function showGeneral(player: Player): Promise<void> {
	const form = new ActionFormData();
	form.title("§0Room Management");
	form.button("Back");
	const backButtonIndex: number = 0;
	form.button("Load All Structures");
	const loadAllIndex: number = 1;
	let resp: ActionFormResponse;
	try {
		resp = await form.show(player);
	} catch (error) {
		if (error instanceof FormRejectError) {
			return;
		} else {
			throw error;
		}
	}
	if (resp.selection === undefined || resp.selection === backButtonIndex) {
		system.run(() => showFormSettings(player));
		return;
	}
	if (resp.selection === loadAllIndex) {
		system.run(() => loadAllStructuresConfirmation(player));
	}
}

async function showRoomType(player: Player, roomType: RoomType): Promise<void> {
	if (roomType.rooms.length === 1) {
		const room: Room | undefined = roomType.rooms[0];
		if (room !== undefined) {
			system.run(() => showRoomInfo(player, room, roomType));
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
	let resp: ActionFormResponse;
	try {
		resp = await form.show(player);
	} catch (error) {
		if (error instanceof FormRejectError) {
			return;
		} else {
			throw error;
		}
	}
	if (resp.selection === undefined) {
		return;
	}
	if (resp.selection === backButtonIndex) {
		system.run(() => showFormSettings(player));
		return;
	}
	const room: Room | undefined = roomType.rooms[resp.selection - roomsStartingIndex];
	if (room !== undefined) {
		system.run(() => showRoomInfo(player, room, roomType));
	}
}

export async function showFormSettings(player: Player): Promise<void> {
	const form = new ActionFormData();
	form.title("§0Room Management");
	form.button("General", "textures/ui/settings_glyph_color_2x.png");
	const generalButtonIndex: number = 0;
	const roomTypesStartingIndex: number = 1;
	for (const type of roomTypes) {
		form.button(type.displayName, type.icon);
	}
	let resp: ActionFormResponse;
	try {
		resp = await form.show(player);
	} catch (error) {
		if (error instanceof FormRejectError) {
			return;
		} else {
			throw error;
		}
	}
	if (resp.selection === undefined) {
		return;
	}
	if (resp.selection === generalButtonIndex) {
		system.run(() => showGeneral(player));
		return;
	}
	const roomType: RoomType | undefined = roomTypes[resp.selection - roomTypesStartingIndex];
	if (roomType !== undefined) {
		system.run(() => showRoomType(player, roomType));
	}
}
