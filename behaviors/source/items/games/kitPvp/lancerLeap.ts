import type { ItemStack, ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { tools } from "../../../tools";
import { entityLeap } from "../../../tools/actions/leap";
import { defaultItemStackFunc } from "../../../tools/componentHelpers";
import { itemUseMap } from "../../events";

const typeId: string = MinecraftItemTypes.Feather;
const nameTag: string = "§rLancer Leap §7(Use)";
tools.itemCooldowns.set(nameTag, typeId, 20 * 3);

itemUseMap.set(nameTag, {
	callback: (event: ItemUseAfterEvent): void => {
		if (tools.itemCooldowns.check(event.source, event.itemStack)) {
			entityLeap(event.source, 4, 0.5);
			event.source.dimension.playSound("mob.horse.land", event.source.location);
		}
	},
	typeId: typeId,
});

export function itemLancerLeap(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}
