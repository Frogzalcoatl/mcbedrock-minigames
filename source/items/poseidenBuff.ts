import { GameMode, type ItemStack, type ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftEffectTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { defaultItemStackFunc } from "./utils/default";
import { itemNameMatches } from "./utils/matches";
import { decrementMainhandItem } from "./utils/remove";

const typeId: string = MinecraftItemTypes.HeartOfTheSea;
const nameTag: string = "§r§bPoseidon Buff §7(Use)";
const effectDuration: number = 20 * 10;

export function itemPoseidenBuff(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}

export function itemPoseidenBuffRun(event: ItemUseAfterEvent): void {
	if (itemNameMatches(event.itemStack, typeId, nameTag)) {
		if (event.source.getGameMode() !== GameMode.Creative) {
			if (!decrementMainhandItem(event.source)) {
				return;
			}
		}
		event.source.addEffect(MinecraftEffectTypes.Speed, effectDuration, { amplifier: 1 });
		event.source.addEffect(MinecraftEffectTypes.ConduitPower, effectDuration);
		event.source.addEffect(MinecraftEffectTypes.Regeneration, effectDuration, { amplifier: 2 });
		event.source.dimension.playSound("random.burp", event.source.location);
	}
}
