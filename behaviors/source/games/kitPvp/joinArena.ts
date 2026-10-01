import {
	EntityComponentTypes,
	type EntityHealthComponent,
	GameMode,
	type Player,
} from "@minecraft/server";
import { MinecraftEffectTypes } from "@minecraft/vanilla-data";
import { MAX_EFFECT_DURATION } from "../../constants";
import { tools } from "../../tools";
import type { Kit } from "../../tools/kits";
import {
	clearEntityEffects,
	clearEntityEquippable,
	clearEntityInventory,
} from "../../tools/misc/componentHelpers";
import { Room } from "../../tools/room/room";

export function joinKitPvpArena(player: Player, kit: Kit): void {
	player.setGameMode(GameMode.Adventure);
	const health: EntityHealthComponent | undefined = player.getComponent(
		EntityComponentTypes.Health,
	);
	if (health !== undefined) {
		health.resetToMaxValue();
	}
	clearEntityEffects(player);
	player.addEffect(MinecraftEffectTypes.Saturation, MAX_EFFECT_DURATION, {
		amplifier: 255,
		showParticles: false,
	});
	clearEntityEquippable(player);
	clearEntityInventory(player);
	tools.kitManager.set(player, kit);
	player.sendMessage(`§7Selected Kit: ${kit.name}`);
	player.teleport({ x: 323, y: 9, z: 204 });
	const room: Room | undefined = Room.findPlayer(player);
	room?.localHub?.leave(player);
}
