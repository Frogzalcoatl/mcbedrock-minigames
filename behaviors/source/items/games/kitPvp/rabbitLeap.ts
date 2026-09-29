import type { ItemStack, ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { tools } from "../../../tools";
import { entityLeap } from "../../../tools/actions/leap";
import { defaultItemStackFunc } from "../../../tools/componentHelpers";
import { itemUseMap } from "../../events";

const typeId: string = MinecraftItemTypes.RabbitFoot;
const nameTag: string = "§rRabbit Leap §7(Use)";
tools.itemCooldowns.set(nameTag, typeId, 60);

itemUseMap.set(nameTag, {
	callback: (event: ItemUseAfterEvent): void => {
		if (tools.itemCooldowns.check(event.source, event.itemStack)) {
			entityLeap(event.source, 3, 0.5);
			event.source.dimension.playSound("mob.rabbit.hurt", event.source.location);
		}
	},
	typeId: typeId,
});

export function itemRabbitLeap(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}
