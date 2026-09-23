import type { ItemStack, ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftEffectTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { decrementMainhandItem, defaultItemStackFunc } from "../../../tools/helpers";
import { itemUseMap } from "../../events";

const typeId: string = MinecraftItemTypes.GoldenCarrot;
const nameTag: string = "§r§eGolden Carrot §7(Use)";
const effectDurationTicks: number = 20 * 10;
const absorptionDurationTicks: number = 20 * 180;

itemUseMap.set(nameTag, {
	callback: (event: ItemUseAfterEvent): void => {
		decrementMainhandItem(event.source);
		event.source.addEffect(MinecraftEffectTypes.Speed, effectDurationTicks, { amplifier: 4 });
		event.source.addEffect(MinecraftEffectTypes.JumpBoost, effectDurationTicks, {
			amplifier: 2,
		});
		event.source.addEffect(MinecraftEffectTypes.Regeneration, effectDurationTicks, {
			amplifier: 2,
		});
		event.source.removeEffect(MinecraftEffectTypes.Absorption);
		event.source.addEffect(MinecraftEffectTypes.Absorption, absorptionDurationTicks, {
			amplifier: 0,
		});
		event.source.dimension.playSound("random.burp", event.source.location);
	},
	typeId: typeId,
});

export function itemRabbitGoldenCarrot(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}
