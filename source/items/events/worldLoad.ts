import { type ItemStack, world } from "@minecraft/server";
import { itemBreezeLeap } from "../breezeLeap";
import { setItemCooldown } from "../utils/cooldown";

world.afterEvents.worldLoad.subscribe(() => {
	const breezeLeap: ItemStack = itemBreezeLeap();
	setItemCooldown(breezeLeap, 100, false);
});
