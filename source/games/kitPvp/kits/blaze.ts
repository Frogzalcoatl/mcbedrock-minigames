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

export function getKitBlaze(): Kit {
	const kit: Kit = {
		boots: new ItemStack(MinecraftItemTypes.LeatherBoots),
		chestplate: new ItemStack(MinecraftItemTypes.GoldenChestplate),
		helmet: new ItemStack(MinecraftItemTypes.LeatherHelmet),
		icon: "textures/items/blaze_rod.png",
		inventory: [],
		leggings: new ItemStack(MinecraftItemTypes.GoldenLeggings),
		name: "Blaze",
	};
	kitArmorEnchant(kit, MinecraftEnchantmentTypes.Protection, 1);
	kitArmorDurability(kit, "unbreakable");
	kitArmorLockMode(kit, ItemLockMode.slot);
	const goldenSword = new ItemStack(MinecraftItemTypes.GoldenSword);
	setDurability(goldenSword, "unbreakable");
	const blazeFireballs = new ItemStack(MinecraftItemTypes.FireCharge);
	blazeFireballs.nameTag = "§rFireball (+2 on Kill)";
	const fireStick = new ItemStack(MinecraftItemTypes.BlazeRod);
	fireStick.nameTag = "§rFire Stick";
	kit.inventory = [
		{ item: goldenSword, slot: 0 },
		{ item: blazeFireballs, slot: 1 },
		{ item: fireStick, slot: 2 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	return kit;
}
