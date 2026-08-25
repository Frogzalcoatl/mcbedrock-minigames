import type { ItemStack, ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { entityLeap } from "../../../entities/leap";
import { itemUseMap } from "../../events/itemUse";
import { itemCooldownCheck, itemCooldownSet } from "../../utils/cooldown";
import { defaultItemStackFunc } from "../../utils/default";

const typeId: string = MinecraftItemTypes.RabbitFoot;
const nameTag: string = "§rRabbit Leap §7(Use)";
itemCooldownSet(nameTag, typeId, 20 * 3);

export function itemRabbitLeap(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}

itemUseMap.set(nameTag, {
	callback: (event: ItemUseAfterEvent): void => {
		if (itemCooldownCheck(event.source, event.itemStack)) {
			entityLeap(event.source, 3, 0.5);
			event.source.dimension.playSound("mob.rabbit.hurt", event.source.location);
		}
	},
	typeId: typeId,
});
