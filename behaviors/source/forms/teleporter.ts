import { type Player, system } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import type { Room } from "../rooms/room";
import { roomTypes } from "../rooms/roomManager";
import type { RoomType } from "../rooms/roomType";
import { safeActionFormShow } from "./safeShow";

export async function showRoomTypesRoomSelect(
	player: Player,
	selectedType: RoomType,
	formOnCancel: boolean,
): Promise<void> {
	if (selectedType.rooms.length === 0) {
		player.sendMessage("§cNo valid rooms to join");
		return;
	} else if (selectedType.rooms.length === 1) {
		const room: Room | undefined = selectedType.rooms[0];
		if (room === undefined) {
			player.sendMessage("§cNo valid rooms to join");
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
	const resp: ActionFormResponse = await safeActionFormShow(form, player);
	if (!player.isValid) {
		return;
	}
	if (resp.selection === undefined) {
		if (formOnCancel) {
			system.run(() => {
				showFormTeleporter(player);
			});
		}
		return;
	}
	const selectedRoom: Room | undefined = selectedType.rooms[resp.selection];
	if (selectedRoom === undefined) {
		player.sendMessage("§cIgnoring attempt to join invalid room");
		return;
	}
	selectedRoom.join(player);
}

export async function showFormTeleporter(player: Player): Promise<void> {
	const form = new ActionFormData();
	form.title("§0Teleporter");
	for (const type of roomTypes) {
		form.button(type.displayName, type.icon);
	}
	const resp: ActionFormResponse = await safeActionFormShow(form, player);
	if (!player.isValid || resp.selection === undefined) {
		return;
	}
	const selectedType: RoomType | undefined = roomTypes[resp.selection];
	if (selectedType === undefined) {
		return;
	}
	showRoomTypesRoomSelect(player, selectedType, true);
}
