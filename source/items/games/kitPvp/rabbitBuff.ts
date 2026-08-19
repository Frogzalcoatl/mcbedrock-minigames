import type { ItemStack, ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftEffectTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { itemUseMap } from "../../events/itemUse";
import { defaultItemStackFunc } from "../../utils/default";
import { decrementMainhandItem } from "../../utils/remove";

const typeId: string = MinecraftItemTypes.GoldenCarrot;
const nameTag: string = "§r§eGolden Carrot §7(Use)";
const effectDuration: number = 10 * 20;

export function itemRabbitBuff(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}

itemUseMap.set(nameTag, {
	callback: (event: ItemUseAfterEvent): void => {
		decrementMainhandItem(event.source);
		event.source.addEffect(MinecraftEffectTypes.Speed, effectDuration, { amplifier: 4 });
		event.source.addEffect(MinecraftEffectTypes.Regeneration, effectDuration, { amplifier: 2 });
		event.source.dimension.playSound("random.burp", event.source.location);
	},
	typeId: typeId,
});
