import { type Player, system, world } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import type { Room } from "../rooms/room";
import { getPlayerRoom } from "../rooms/roomManager";
import { safeActionFormShow } from "./safeShow";

export async function showFormPlayerProfile(
	viewer: Player,
	playerToView: Player,
	showPlayersFormOnCancel: boolean,
): Promise<void> {
	const form = new ActionFormData();
	form.title(`§0${playerToView.name}`);
	const room: Room | null = getPlayerRoom(playerToView);
	let currentButtonIndex = 0;
	let joinButtonIndex: number | undefined;
	if (viewer.id !== playerToView.id && room !== null) {
		form.button(`>> Join <<\nPlaying: ${room.displayName}`);
		joinButtonIndex = currentButtonIndex;
		currentButtonIndex++;
	}
	const resp: ActionFormResponse = await safeActionFormShow(form, viewer);
	if (!(viewer.isValid && playerToView.isValid)) {
		return;
	}
	if (resp.selection === undefined) {
		if (showPlayersFormOnCancel) {
			system.run(() => {
				showFormAllProfiles(viewer);
			});
		}
	} else if (resp.selection === joinButtonIndex) {
		const room: Room | null = getPlayerRoom(playerToView);
		if (room !== null) {
			room.join(viewer);
		}
	}
}

export async function showFormAllProfiles(player: Player): Promise<void> {
	const form = new ActionFormData();
	form.title(`§0Players`);
	const worldPlayers: Player[] = world.getAllPlayers();
	for (const p of worldPlayers) {
		form.button(p.name);
	}
	const resp: ActionFormResponse = await safeActionFormShow(form, player);
	if (!player.isValid || resp.selection === undefined) {
		return;
	}
	const selectedPlayer: Player | undefined = worldPlayers[resp.selection];
	if (selectedPlayer === undefined || !selectedPlayer.isValid) {
		player.sendMessage("§cPlayer not found");
		return;
	} else {
		system.run(() => {
			showFormPlayerProfile(player, selectedPlayer, true);
		});
	}
}
