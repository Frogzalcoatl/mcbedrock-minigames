import type { Player } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import type { Room } from "./room";
import { roomTypes } from "./roomManager";
import type { RoomType } from "./roomType";

export async function showRoomTypeRoomSelectForm(
	player: Player,
	selectedType: RoomType,
	formOnCancel: boolean,
): Promise<void> {
	if (selectedType.rooms.length === 0) {
		player.sendMessage("§cNo valid rooms to join.");
		return;
	} else if (selectedType.rooms.length === 1) {
		const room: Room | undefined = selectedType.rooms[0];
		if (room === undefined) {
			player.sendMessage("§cNo valid rooms to join.");
		} else {
			room.join(player);
		}
		return;
	}
	const form = new ActionFormData();
	form.title(`§0${selectedType.displayName} Rooms`);
	for (const room of selectedType.rooms) {
		form.button(room.displayName, room.icon);
	}
	const resp: ActionFormResponse = await form.show(player);
	if (resp.selection === undefined) {
		if (formOnCancel) {
			showRoomTypeForm(player);
		}
		return;
	}
	const selectedRoom: Room | undefined = selectedType.rooms[resp.selection];
	if (selectedRoom === undefined) {
		player.sendMessage("§cIgnoring attempt to join invalid room.");
		return;
	}
	selectedRoom.join(player);
}

export async function showRoomTypeForm(player: Player): Promise<void> {
	const form = new ActionFormData();
	form.title("§0Teleporter");
	for (const type of roomTypes) {
		form.button(type.displayName, type.icon);
	}
	const resp: ActionFormResponse = await form.show(player);
	if (resp.selection === undefined) {
		return;
	}
	const selectedType: RoomType | undefined = roomTypes[resp.selection];
	if (selectedType === undefined) {
		return;
	}
	showRoomTypeRoomSelectForm(player, selectedType, true);
}
