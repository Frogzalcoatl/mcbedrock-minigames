import type { Player } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import { clearEntityInventory } from "../../entities/clearEntityInventory";
import { giveKit, kits } from "../../kits/kitManager";
import { joinRoomType } from "../../rooms/roomManager";
import roomTypes from "../../roomTypeNames";

export async function showKitsForm(player: Player): Promise<void> {
	const form = new ActionFormData();
	form.title("§0Kit Selection");
	for (const kit of kits) {
		form.button(kit.name, kit.icon);
	}
	const resp: ActionFormResponse = await form.show(player);
	if (resp.selection === undefined) {
		return;
	}
	clearEntityInventory(player);
	giveKit(player, resp.selection);
	joinRoomType(player, roomTypes.kitPvp);
}
