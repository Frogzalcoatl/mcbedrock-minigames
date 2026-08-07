import type { Player } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import { type Kit, kits } from "../../kits/kitManager";

// returns selected kit index
export async function showKitsForm(
	player: Player,
	roomTypeId: string,
): Promise<number | undefined> {
	const form = new ActionFormData();
	form.title("§0Kit Selection");
	const roomTypeKits: Kit[] | undefined = kits.get(roomTypeId);
	if (roomTypeKits === undefined) {
		return;
	}
	for (const kit of roomTypeKits) {
		form.button(kit.name, kit.icon);
	}
	const resp: ActionFormResponse = await form.show(player);
	return Promise.resolve(resp.selection);
}
