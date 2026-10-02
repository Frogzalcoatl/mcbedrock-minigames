import type { ItemStack, ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { tools } from "../../tools";
import { entityLeap } from "../../tools/helpers/actions";
import { defaultItemStackFunc } from "../../tools/helpers/entityComponents";

const typeId: string = MinecraftItemTypes.Feather;
const nameTag: string = "§rLancer Leap §7(Use)";

tools.items.cooldowns.set(nameTag, typeId, 20 * 3);

tools.items.itemUseSet(nameTag, typeId, (event: ItemUseAfterEvent): void => {
	if (tools.items.cooldowns.check(event.source, event.itemStack)) {
		entityLeap(event.source, 4, 0.5);
		event.source.dimension.playSound("mob.horse.land", event.source.location);
	}
});

export function itemLancerLeap(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}
