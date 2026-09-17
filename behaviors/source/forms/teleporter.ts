import { type Player, system } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import { RoomType } from "../tools/rooms/roomType";
import { safeActionFormShow } from "./safeShow";

export async function showFormTeleporter(player: Player): Promise<void> {
	const form = new ActionFormData();
	form.title("§0Teleporter");
	const roomTypes: RoomType[] = RoomType.getAll();
	for (const type of roomTypes) {
		form.button(type.displayName, type.icon);
	}
	const resp: ActionFormResponse = await safeActionFormShow(form, player);
	if (!player.isValid || resp.selection === undefined) {
		return;
	}
	const selectedType: RoomType | undefined = roomTypes[resp.selection];
	if (selectedType === undefined) {
		player.sendMessage(`§cUnable to get selected room type at index ${resp.selection}`);
		return;
	}
	if (selectedType.rooms.length === 1) {
		selectedType.join(player);
		return;
	}
	const joinedRoom: boolean = await selectedType.form(player);
	if (!joinedRoom && player.isValid) {
		system.run(() => {
			showFormTeleporter(player);
		});
	}
}
