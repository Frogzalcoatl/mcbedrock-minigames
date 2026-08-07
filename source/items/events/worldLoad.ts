import { type ItemStack, world } from "@minecraft/server";
import { setItemCooldown } from "../../rooms/modules/itemCooldownManager";
import { itemBreezeLeap } from "../breezeLeap";

world.afterEvents.worldLoad.subscribe(() => {
	const breezeLeap: ItemStack = itemBreezeLeap();
	setItemCooldown(breezeLeap, 40);
});
