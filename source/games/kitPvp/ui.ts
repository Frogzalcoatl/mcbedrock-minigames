import type { Player } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import { kits } from "../../kits/kitManager";

// returns selected kit index
export async function showKitsForm(player: Player): Promise<number | undefined> {
	const form = new ActionFormData();
	form.title("§0Kit Selection");
	for (const kit of kits) {
		form.button(kit.name, kit.icon);
	}
	const resp: ActionFormResponse = await form.show(player);
	return Promise.resolve(resp.selection);
}
