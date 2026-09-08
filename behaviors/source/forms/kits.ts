import type { Player } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import { type Kit, kits } from "../kits/kitManager";
import { safeActionFormShow } from "./safeShow";

// returns selected kit index
export async function showFormKits(
	player: Player,
	roomTypeId: string,
): Promise<number | undefined> {
	const form = new ActionFormData();
	form.title("§0Kit Selection");
	const roomTypeKits: Kit[] | undefined = kits.get(roomTypeId);
	if (roomTypeKits === undefined) {
		return undefined;
	}
	for (const kit of roomTypeKits) {
		form.button(kit.name, kit.icon);
	}
	const resp: ActionFormResponse = await safeActionFormShow(form, player);
	if (!player.isValid) {
		return;
	}
	return resp.selection;
}
