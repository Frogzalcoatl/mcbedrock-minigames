import { ItemLockMode, ItemStack } from "@minecraft/server";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { setDurability } from "../../../items/utils/durability";
import type { Kit } from "../kitManager";
import {
	kitArmorDurability,
	kitArmorEnchant,
	kitArmorLockMode,
	kitInventoryLockMode,
} from "../utils";

export function getKitBreeze(): Kit {
	const kit: Kit = {
		boots: new ItemStack(MinecraftItemTypes.LeatherBoots),
		chestplate: new ItemStack(MinecraftItemTypes.ChainmailChestplate),
		helmet: new ItemStack(MinecraftItemTypes.LeatherHelmet),
		icon: "textures/items/wind_charge.png",
		inventory: [],
		leggings: new ItemStack(MinecraftItemTypes.ChainmailLeggings),
		name: "Breeze",
	};
	kitArmorEnchant(kit, MinecraftEnchantmentTypes.Protection, 1);
	kitArmorDurability(kit, "unbreakable");
	kitArmorLockMode(kit, ItemLockMode.slot);
	const mace = new ItemStack(MinecraftItemTypes.Mace);
	setDurability(mace, "unbreakable");
	const windCharge = new ItemStack(MinecraftItemTypes.WindCharge, 8);
	windCharge.nameTag = "§rWind Charge (+1 on Kill)";
	const breezeLeap = new ItemStack(MinecraftItemTypes.BreezeRod);
	breezeLeap.nameTag = "§rBreeze Leap";
	kit.inventory = [
		{ item: mace, slot: 0 },
		{ item: windCharge, slot: 1 },
		{ item: breezeLeap, slot: 2 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	return kit;
}
