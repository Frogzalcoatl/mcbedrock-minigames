import { type Player, system, world } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import type { Room } from "../rooms/room";
import { getPlayerRoom } from "../rooms/roomManager";

export async function showPlayerProfileForm(
	viewer: Player,
	player: Player,
	showPlayersFormOnCancel: boolean,
): Promise<void> {
	if (!(viewer.isValid && player.isValid)) {
		return;
	}
	const form = new ActionFormData();
	form.title(`§0${player.name}`);
	const room: Room | null = getPlayerRoom(player);
	let currentButtonIndex: number = 0;
	let joinButtonIndex: number | undefined;
	if (viewer.id !== player.id && room !== null) {
		form.button(`>> Join <<\nPlaying: ${room.displayName}`);
		joinButtonIndex = currentButtonIndex;
		currentButtonIndex++;
	}
	const resp: ActionFormResponse = await form.show(viewer);
	if (!(viewer.isValid && player.isValid)) {
		return;
	}
	if (resp.selection === undefined) {
		if (showPlayersFormOnCancel) {
			system.run(() => showPlayersForm(viewer));
		}
		return;
	}
	switch (resp.selection) {
		case joinButtonIndex:
			{
				const room: Room | null = getPlayerRoom(player);
				if (room !== null) {
					room.join(viewer);
				}
			}
			break;
	}
}

export async function showPlayersForm(player: Player): Promise<void> {
	if (!player.isValid) {
		return;
	}
	const form = new ActionFormData();
	form.title(`§0Players`);
	const worldPlayers: Player[] = world.getAllPlayers();
	for (const p of worldPlayers) {
		form.button(p.name);
	}
	const resp: ActionFormResponse = await form.show(player);
	if (resp.selection === undefined || !player.isValid) {
		return;
	}
	const selectedPlayer: Player | undefined = worldPlayers[resp.selection];
	if (selectedPlayer === undefined || !selectedPlayer.isValid) {
		player.sendMessage("§cPlayer not found.");
		return;
	} else {
		system.run(() => showPlayerProfileForm(player, selectedPlayer, true));
	}
}
