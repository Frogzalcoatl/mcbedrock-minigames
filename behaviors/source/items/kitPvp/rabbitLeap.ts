import type { ItemStack, ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { tools } from "../../tools";
import { entityLeap } from "../../tools/helpers/actions";
import { defaultItemStackFunc } from "../../tools/helpers/entityComponents";

const typeId: string = MinecraftItemTypes.RabbitFoot;
const nameTag: string = "§rRabbit Leap §7(Use)";

tools.items.cooldowns.set(nameTag, typeId, 60);

tools.items.onUse(nameTag, typeId, (event: ItemUseAfterEvent): void => {
	if (tools.items.cooldowns.check(event.source, event.itemStack)) {
		entityLeap(event.source, 3, 0.5);
		event.source.dimension.playSound("mob.rabbit.hurt", event.source.location);
	}
});

export function itemRabbitLeap(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}
