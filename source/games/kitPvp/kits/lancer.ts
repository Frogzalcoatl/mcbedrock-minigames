import { ItemLockMode, ItemStack } from "@minecraft/server";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { setDurability } from "../../../items/durability";
import type { Kit } from "../kitManager";
import {
	kitArmorDurability,
	kitArmorEnchant,
	kitArmorLockMode,
	kitInventoryLockMode,
} from "../utils";

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
	kitArmorEnchant(kit, MinecraftEnchantmentTypes.Protection, 1);
	kitArmorDurability(kit, "unbreakable");
	kitArmorLockMode(kit, ItemLockMode.slot);
	const ironSpear = new ItemStack(MinecraftItemTypes.IronSpear);
	setDurability(ironSpear, "unbreakable");
	const leap = new ItemStack(MinecraftItemTypes.Feather);
	leap.nameTag = "§rLeap";
	const tempHorse = new ItemStack(MinecraftItemTypes.ZombieHorseSpawnEgg);
	tempHorse.nameTag = "§rTemp Horse";
	kit.inventory = [
		{ item: ironSpear, slot: 0 },
		{ item: leap, slot: 1 },
		{ item: tempHorse, slot: 2 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	return kit;
}
