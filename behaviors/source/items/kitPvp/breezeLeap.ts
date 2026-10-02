import type { ItemStack, ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { tools } from "../../tools";
import { entityLeap } from "../../tools/helpers/actions";
import { defaultItemStackFunc } from "../../tools/helpers/entityComponents";

const typeId: string = MinecraftItemTypes.BreezeRod;
const nameTag: string = "§r§bBreeze Leap §7(Use)";

tools.items.cooldowns.set(nameTag, typeId, 20 * 3);

tools.items.itemUseSet(nameTag, typeId, (event: ItemUseAfterEvent): void => {
	if (tools.items.cooldowns.check(event.source, event.itemStack)) {
		entityLeap(event.source, 3, 0.5);
		event.source.dimension.spawnParticle(
			"minecraft:wind_explosion_emitter",
			event.source.location,
		);
		event.source.dimension.playSound("mob.breeze.jump", event.source.location);
	}
});

export function itemBreezeLeap(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}
