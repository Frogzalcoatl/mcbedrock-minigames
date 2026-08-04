import type { Player } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import type { Room } from "./room";
import { rooms } from "./roomManager";

export async function showRoomNavForm(player: Player): Promise<void> {
	if (!player.isValid) {
		return;
	}
	const form: ActionFormData = new ActionFormData();
	form.title("Room Navigation");
	for (const g of rooms) {
		form.button(g.displayName);
	}
	const resp: ActionFormResponse = await form.show(player);
	if (resp.selection === undefined || !player.isValid) {
		return;
	}
	const room: Room | undefined = rooms[resp.selection];
	if (room === undefined) {
		return;
	}
	room.join(player);
}
