import {
	EntityComponentTypes,
	type EntityHealthComponent,
	GameMode,
	type Player,
} from "@minecraft/server";
import { MinecraftEffectTypes } from "@minecraft/vanilla-data";
import { MAX_EFFECT_DURATION, roomTypeIds } from "../../constants";
import { clearEntityEffects, clearEntityInventory } from "../../tools/componentHelpers";
import { giveKit, type Kit } from "../../tools/games/kits";
import { Room } from "../../tools/rooms/room";

export function joinKitPvpArena(player: Player, selectedKitIndex: number): void {
	player.setGameMode(GameMode.Adventure);
	const health: EntityHealthComponent | undefined = player.getComponent(
		EntityComponentTypes.Health,
	);
	if (health !== undefined) {
		health.resetToMaxValue();
	}
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
	const room: Room | undefined = Room.findPlayer(player);
	room?.hub?.leave(player);
}
