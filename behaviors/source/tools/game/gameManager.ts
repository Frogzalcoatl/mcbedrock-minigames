import { type Player, system } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import { showFormTeleporter } from "../../forms/teleporter";
import { safeActionFormShow } from "../helpers/safeFormShow";
import type { GameType } from "./gameType";

export class GameManager {
	public readonly types: GameType[];

	public constructor() {
		this.types = [];
	}

	public async queue(player: Player, gameId: string): Promise<boolean> {
		const type: GameType | undefined = this.types.find((t) => t.id === gameId);
		if (type === undefined) {
			return false;
		}
		return await type.queue(player);
	}

	public async form(player: Player): Promise<void> {
		const form = new ActionFormData();
		form.title("§0Teleporter");
		for (const type of this.types) {
			const playerCount: number = type.playerCount;
			form.button(
				`${type.displayName}§r\n${playerCount} Player${playerCount !== 1 ? "s" : ""}`,
				type.icon,
			);
		}
		const resp: ActionFormResponse = await safeActionFormShow(form, player);
		if (!player.isValid || resp.selection === undefined) {
			return;
		}
		const selectedType: GameType | undefined = this.types[resp.selection];
		if (selectedType === undefined) {
			player.sendMessage(`§cUnable to get selected room type at index ${resp.selection}`);
			return;
		}
		const queueResult: boolean = await selectedType.queue(player);
		if (!queueResult && player.isValid) {
			system.run(() => {
				showFormTeleporter(player);
			});
		}
	}
}
