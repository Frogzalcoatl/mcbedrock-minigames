import type { ItemStack, ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { entityLeap } from "../../../entities/leap";
import { itemUseMap } from "../../events/itemUse";
import { isItemCooldownFinished, setItemCooldown } from "../../utils/cooldown";
import { defaultItemStackFunc } from "../../utils/default";

const typeId: string = MinecraftItemTypes.BreezeRod;
const nameTag: string = "§r§bBreeze Leap §7(Use)";
setItemCooldown(nameTag, typeId, 20 * 3);

export function itemBreezeLeap(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}

itemUseMap.set(nameTag, {
	callback: (event: ItemUseAfterEvent): void => {
		if (isItemCooldownFinished(event.source, event.itemStack)) {
			entityLeap(event.source, 3, 0.5);
			event.source.dimension.spawnParticle(
				"minecraft:wind_explosion_emitter",
				event.source.location,
			);
			event.source.dimension.playSound("mob.breeze.jump", event.source.location);
		}
	},
	typeId: typeId,
});
