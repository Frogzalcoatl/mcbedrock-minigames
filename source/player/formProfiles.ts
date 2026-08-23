import { type Player, system, world } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse, FormRejectError } from "@minecraft/server-ui";
import type { Room } from "../rooms/room";
import { getPlayerRoom } from "../rooms/roomManager";

export async function showFormPlayerProfile(
	viewer: Player,
	playerToView: Player,
	showPlayersFormOnCancel: boolean,
): Promise<void> {
	if (!(viewer.isValid && playerToView.isValid)) {
		return;
	}
	const form = new ActionFormData();
	form.title(`§0${playerToView.name}`);
	const room: Room | null = getPlayerRoom(playerToView);
	let currentButtonIndex: number = 0;
	let joinButtonIndex: number | undefined;
	if (viewer.id !== playerToView.id && room !== null) {
		form.button(`>> Join <<\nPlaying: ${room.displayName}`);
		joinButtonIndex = currentButtonIndex;
		currentButtonIndex++;
	}
	let resp: ActionFormResponse;
	try {
		resp = await form.show(viewer);
	} catch (error) {
		if (error instanceof FormRejectError) {
			return;
		} else {
			throw error;
		}
	}
	if (!playerToView.isValid) {
		return;
	}
	if (resp.selection === undefined) {
		if (showPlayersFormOnCancel) {
			system.run(() => showFormAllProfiles(viewer));
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
	let resp: ActionFormResponse;
	try {
		resp = await form.show(player);
	} catch (error) {
		if (error instanceof FormRejectError) {
			return;
		} else {
			throw error;
		}
	}
	if (resp.selection === undefined) {
		return;
	}
	const selectedPlayer: Player | undefined = worldPlayers[resp.selection];
	if (selectedPlayer === undefined || !selectedPlayer.isValid) {
		player.sendMessage("§cPlayer not found.");
		return;
	} else {
		system.run(() => showFormPlayerProfile(player, selectedPlayer, true));
	}
}
