import type { Player } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse, FormRejectError } from "@minecraft/server-ui";
import { type Kit, kits } from "./kitManager";

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
	let resp: ActionFormResponse;
	try {
		resp = await form.show(player);
	} catch (error) {
		if (error instanceof FormRejectError) {
			return undefined;
		} else {
			throw error;
		}
	}
	return resp.selection;
}
