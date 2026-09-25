import type { ItemStack, ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { entityLeap } from "../../../tools/actions/leap";
import { defaultItemStackFunc } from "../../../tools/componentHelpers";
import { itemCooldownCheck, itemCooldownSet } from "../../cooldowns";
import { itemUseMap } from "../../events";

const typeId: string = MinecraftItemTypes.BreezeRod;
const nameTag: string = "§r§bBreeze Leap §7(Use)";
itemCooldownSet(nameTag, typeId, 20 * 3);

itemUseMap.set(nameTag, {
	callback: (event: ItemUseAfterEvent): void => {
		if (itemCooldownCheck(event.source, event.itemStack)) {
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

export function itemBreezeLeap(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}
