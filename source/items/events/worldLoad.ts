import { type ItemStack, world } from "@minecraft/server";
import { itemBreezeLeap, itemBreezeLeapCooldownTicks } from "../breezeLeap";
import { itemLancerLeap, itemLancerLeapCooldownTicks } from "../lancerLeap";
import { setItemCooldown } from "../utils/cooldown";
import { itemZombieHorse, itemZombieHorseCooldownTicks } from "../zombieHorse";

world.afterEvents.worldLoad.subscribe(() => {
	const breezeLeap: ItemStack = itemBreezeLeap();
	setItemCooldown(breezeLeap, itemBreezeLeapCooldownTicks, false);
	const lancerLeap: ItemStack = itemLancerLeap();
	setItemCooldown(lancerLeap, itemLancerLeapCooldownTicks, false);
	const zombieHorse: ItemStack = itemZombieHorse();
	setItemCooldown(zombieHorse, itemZombieHorseCooldownTicks, true);
});
