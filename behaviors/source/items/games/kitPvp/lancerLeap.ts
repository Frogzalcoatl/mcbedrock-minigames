import type { ItemStack, ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { entityLeap } from "../../../entities/leap";
import { itemUseMap } from "../../events/itemUse";
import { itemCooldownCheck, itemCooldownSet } from "../../utils/cooldown";
import { defaultItemStackFunc } from "../../utils/default";

const typeId: string = MinecraftItemTypes.Feather;
const nameTag: string = "§rLancer Leap §7(Use)";
itemCooldownSet(nameTag, typeId, 20 * 3);

export function itemLancerLeap(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}

itemUseMap.set(nameTag, {
	callback: (event: ItemUseAfterEvent): void => {
		if (itemCooldownCheck(event.source, event.itemStack)) {
			entityLeap(event.source, 4, 0.5);
			event.source.dimension.playSound("mob.horse.land", event.source.location);
		}
	},
	typeId: typeId,
});
