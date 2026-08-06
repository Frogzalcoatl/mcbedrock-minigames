import type { Player } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import type { Room } from "./room";
import { rooms } from "./roomManager";

async function showRoomInfo(player: Player, room: Room): Promise<void> {
	if (!player.isValid) {
		return;
	}
	const form = new ActionFormData();
	form.title(`§0${room.displayName}`);
	form.body(room.info());
	form.divider();
	form.button("Join");
	form.button("Load Structures");
	form.divider();
	const joinButtonIndex: number = 0;
	const structuresButtonIndex: number = 1;
	const resp: ActionFormResponse = await form.show(player);
	if (resp.selection === undefined) {
		showRoomNavForm(player);
		return;
	}
	if (resp.selection === joinButtonIndex) {
		room.join(player);
	} else if (resp.selection === structuresButtonIndex) {
		room.loadStructures();
	}
}

export async function showRoomNavForm(player: Player): Promise<void> {
	if (!player.isValid) {
		return;
	}
	const form = new ActionFormData();
	form.title("§0Room Navigation");
	for (const room of rooms) {
		form.button(room.displayName);
	}
	const resp: ActionFormResponse = await form.show(player);
	if (resp.selection === undefined || !player.isValid) {
		return;
	}
	const room: Room | undefined = rooms[resp.selection];
	if (room === undefined) {
		return;
	}
	showRoomInfo(player, room);
}
