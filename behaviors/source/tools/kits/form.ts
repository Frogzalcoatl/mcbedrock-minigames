import type { Player } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import { safeActionFormShow } from "../shared/safeFormShow";
import type { Kit } from "./manager";

// Returns selected kit
export async function kitSelectionForm(kits: Kit[], viewer: Player): Promise<Kit | undefined> {
	const form = new ActionFormData();
	form.title("§0Kit Selection");
	for (const kit of kits) {
		form.button(kit.name, kit.icon);
	}
	const resp: ActionFormResponse = await safeActionFormShow(form, viewer);
	if (!viewer.isValid || resp.selection === undefined) {
		return undefined;
	} else {
		return kits[resp.selection];
	}
}
