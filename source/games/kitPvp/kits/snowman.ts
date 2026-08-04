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

const ICE_BOMB_ID: string = "minecraft:ice_bomb";

export function getKitSnowman(): Kit {
	const kit: Kit = {
		boots: new ItemStack(MinecraftItemTypes.ChainmailBoots),
		chestplate: new ItemStack(MinecraftItemTypes.ChainmailChestplate),
		helmet: new ItemStack(MinecraftItemTypes.ChainmailHelmet),
		icon: "textures/items/snowball.png",
		inventory: [],
		leggings: new ItemStack(MinecraftItemTypes.ChainmailLeggings),
		name: "Snowman",
	};
	kitArmorEnchant(kit, MinecraftEnchantmentTypes.Protection, 1);
	kitArmorDurability(kit, "unbreakable");
	kitArmorLockMode(kit, ItemLockMode.slot);
	const ironSword = new ItemStack(MinecraftItemTypes.IronSword);
	setDurability(ironSword, "unbreakable");
	const snowballs = new ItemStack(MinecraftItemTypes.Snowball, 16);
	const iceBomb = new ItemStack(ICE_BOMB_ID, 2);
	kit.inventory = [
		{ item: ironSword, slot: 0 },
		{ item: snowballs, slot: 1 },
		{ item: iceBomb, slot: 2 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	return kit;
}
