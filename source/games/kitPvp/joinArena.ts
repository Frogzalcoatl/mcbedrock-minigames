import { GameMode, type Player } from "@minecraft/server";
import { MinecraftEffectTypes } from "@minecraft/vanilla-data";
import { MAX_EFFECT_DURATION } from "../../constants";
import { clearEntityEffects } from "../../entities/effects";
import { setEntityHealth } from "../../entities/health";
import { clearEntityInventory } from "../../entities/inventory";
import { giveKit, type Kit } from "../../kits/kitManager";
import type { Room } from "../../rooms/room";
import { getPlayerRoom } from "../../rooms/roomManager";
import roomTypeIds from "../../roomTypeIds";

export function joinKitPvpArena(player: Player, selectedKitIndex: number): void {
	player.setGameMode(GameMode.Adventure);
	setEntityHealth(player, "max");
	clearEntityInventory(player);
	clearEntityEffects(player);
	player.addEffect(MinecraftEffectTypes.Saturation, MAX_EFFECT_DURATION, {
		amplifier: 255,
		showParticles: false,
	});
	const givenKit: Kit | undefined = giveKit(player, roomTypeIds.kitPvp, selectedKitIndex);
	if (givenKit !== undefined) {
		player.sendMessage(`§7Selected Kit: ${givenKit.name}`);
	}
	player.teleport({ x: 323, y: 9, z: 204 });
	const room: Room | null = getPlayerRoom(player);
	room?.hub?.leave(player);
}
