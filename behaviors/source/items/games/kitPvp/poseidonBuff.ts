import { GameMode, type ItemStack, type ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftEffectTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { itemUseMap } from "../../events/itemUse";
import { defaultItemStackFunc } from "../../utils/default";
import { decrementMainhandItem } from "../../utils/remove";

const typeId: string = MinecraftItemTypes.HeartOfTheSea;
const nameTag: string = "§r§bPoseidon Buff §7(Use)";
const effectDurationTicks: number = 20 * 10;
const absoprtionDurationTicks: number = 20 * 120;

export function itemPoseidonBuff(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}

itemUseMap.set(nameTag, {
	callback: (event: ItemUseAfterEvent): void => {
		if (event.source.getGameMode() !== GameMode.Creative) {
			decrementMainhandItem(event.source);
		}
		event.source.addEffect(MinecraftEffectTypes.Speed, effectDurationTicks, { amplifier: 1 });
		event.source.addEffect(MinecraftEffectTypes.ConduitPower, effectDurationTicks);
		event.source.addEffect(MinecraftEffectTypes.Regeneration, effectDurationTicks, {
			amplifier: 2,
		});
		event.source.removeEffect(MinecraftEffectTypes.Absorption);
		event.source.addEffect(MinecraftEffectTypes.Absorption, absoprtionDurationTicks, {
			amplifier: 0,
		});
		event.source.dimension.playSound("random.burp", event.source.location);
	},
	typeId: typeId,
});
