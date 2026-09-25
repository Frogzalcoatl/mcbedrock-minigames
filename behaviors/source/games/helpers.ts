import { EntityComponentTypes, type EntityHealthComponent, type Player } from "@minecraft/server";
import { MinecraftEffectTypes } from "@minecraft/vanilla-data";
import { MAX_EFFECT_DURATION } from "../constants";
import {
	clearEntityEffects,
	clearEntityEquippable,
	clearEntityInventory,
} from "../tools/componentHelpers";

export function hubEffectHelper(player: Player): void {
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
	player.addEffect(MinecraftEffectTypes.Weakness, MAX_EFFECT_DURATION, {
		amplifier: 255,
		showParticles: false,
	});
	clearEntityEquippable(player);
	clearEntityInventory(player);
}
