import { ItemLockMode, ItemStack } from "@minecraft/server";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { setDurability } from "../../durability";
import { applyEnchant } from "../../enchant";
import type { Kit } from "../kitManager";
import {
	kitArmorDurability,
	kitArmorEnchant,
	kitArmorLockMode,
	kitInventoryLockMode,
} from "../utils";

export function getKitPoseidon(): Kit {
	const kit: Kit = {
		boots: new ItemStack(MinecraftItemTypes.LeatherBoots),
		chestplate: new ItemStack(MinecraftItemTypes.ChainmailChestplate),
		helmet: new ItemStack(MinecraftItemTypes.TurtleHelmet),
		icon: "textures/items/trident.png",
		inventory: [],
		leggings: new ItemStack(MinecraftItemTypes.LeatherLeggings),
		name: "Poseidon",
	};
	kitArmorEnchant(kit, MinecraftEnchantmentTypes.Protection, 1);
	kitArmorDurability(kit, "unbreakable");
	kitArmorLockMode(kit, ItemLockMode.slot);
	const trident = new ItemStack(MinecraftItemTypes.Trident);
	applyEnchant(trident, MinecraftEnchantmentTypes.Loyalty, 3);
	setDurability(trident, "unbreakable");
	const effectBuff = new ItemStack(MinecraftItemTypes.HeartOfTheSea);
	effectBuff.nameTag = "§rEffect Buff (+1 on Kill)";
	const lightning = new ItemStack(MinecraftItemTypes.EndRod);
	lightning.nameTag = "§rLightning";
	kit.inventory = [
		{ item: trident, slot: 0 },
		{ item: effectBuff, slot: 1 },
		{ item: lightning, slot: 2 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	return kit;
}
