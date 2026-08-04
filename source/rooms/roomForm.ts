import type { Player } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import type { Room } from "./room";
import { gameRooms } from "./roomManager";

export async function showRoomNavForm(player: Player): Promise<void> {
	if (!player.isValid) {
		return;
	}
	const form: ActionFormData = new ActionFormData();
	form.title("Room Navigation");
	for (const g of gameRooms) {
		form.button(g.displayName);
	}
	const resp: ActionFormResponse = await form.show(player);
	if (resp.selection === undefined || !player.isValid) {
		return;
	}
	const gameRoom: Room | undefined = gameRooms[resp.selection];
	if (gameRoom === undefined) {
		return;
	}
	gameRoom.join(player);
}
