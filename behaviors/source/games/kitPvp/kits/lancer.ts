import { ItemLockMode, ItemStack } from "@minecraft/server";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { itemLancerLeap } from "../../../items/games/kitPvp/lancerLeap";
import { itemZombieHorse } from "../../../items/games/kitPvp/zombieHorse";
import { setDurability } from "../../../items/utils/durability";
import { applyEnchant } from "../../../items/utils/enchant";
import type { Kit } from "../../../kits/kitManager";
import {
	kitArmorDurability,
	kitArmorEnchant,
	kitArmorLockMode,
	kitInventoryLockMode,
} from "../../../kits/utils";

export function getKitLancer(): Kit {
	const kit: Kit = {
		boots: new ItemStack(MinecraftItemTypes.ChainmailBoots),
		chestplate: new ItemStack(MinecraftItemTypes.ChainmailChestplate),
		helmet: new ItemStack(MinecraftItemTypes.ChainmailHelmet),
		icon: "textures/items/spear/iron_spear.png",
		inventory: [],
		leggings: new ItemStack(MinecraftItemTypes.LeatherLeggings),
		name: "Lancer",
	};
	kitArmorEnchant(kit, MinecraftEnchantmentTypes.Protection, 4);
	kitArmorDurability(kit, "unbreakable");
	kitArmorLockMode(kit, ItemLockMode.slot);
	const spear = new ItemStack(MinecraftItemTypes.NetheriteSpear);
	setDurability(spear, "unbreakable");
	applyEnchant(spear, MinecraftEnchantmentTypes.Lunge, 3);
	applyEnchant(spear, MinecraftEnchantmentTypes.Sharpness, 2);
	const leap: ItemStack = itemLancerLeap();
	const zombieHorse: ItemStack = itemZombieHorse();
	kit.inventory = [
		{ item: spear, slot: 0 },
		{ item: leap, slot: 1 },
		{ item: zombieHorse, slot: 2 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	return kit;
}
