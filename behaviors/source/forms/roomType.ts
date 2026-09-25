import type { Player } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import type { Room } from "../tools/room/room";
import type { RoomType } from "../tools/room/roomType";
import { safeActionFormShow } from "./safeShow";

// Returns true if player selected a room
export async function formRoomType(player: Player, type: RoomType): Promise<boolean> {
	const form = new ActionFormData();
	form.title(`§0${type.displayName} Rooms`);
	for (const room of type.rooms) {
		form.button(room.displayName, room.icon);
	}
	const resp: ActionFormResponse = await safeActionFormShow(form, player);
	if (!player.isValid || resp.selection === undefined) {
		return false;
	}
	const selectedRoom: Room | undefined = type.rooms[resp.selection];
	if (selectedRoom === undefined) {
		player.sendMessage("§cUnable to find selected room");
		return false;
	}
	selectedRoom.join(player);
	return true;
}
