import { ItemLockMode, ItemStack } from "@minecraft/server";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { setDurability } from "../../durability";
import type { Kit } from "../kitManager";
import {
	kitArmorDurability,
	kitArmorEnchant,
	kitArmorLockMode,
	kitInventoryLockMode,
} from "../utils";

export function getKitRabbit(): Kit {
	const kit: Kit = {
		boots: new ItemStack(MinecraftItemTypes.LeatherBoots),
		chestplate: new ItemStack(MinecraftItemTypes.IronChestplate),
		helmet: new ItemStack(MinecraftItemTypes.LeatherHelmet),
		icon: "textures/items/rabbit_foot.png",
		inventory: [],
		leggings: new ItemStack(MinecraftItemTypes.ChainmailLeggings),
		name: "Rabbit",
	};
	kitArmorEnchant(kit, MinecraftEnchantmentTypes.Protection, 1);
	kitArmorDurability(kit, "unbreakable");
	kitArmorLockMode(kit, ItemLockMode.slot);
	const diamondAxe = new ItemStack(MinecraftItemTypes.DiamondAxe);
	setDurability(diamondAxe, "unbreakable");
	const leap = new ItemStack(MinecraftItemTypes.RabbitFoot);
	leap.nameTag = "§rLeap";
	const sppedBuff = new ItemStack(MinecraftItemTypes.GoldenCarrot);
	sppedBuff.nameTag = "§rSpeed Buff";
	kit.inventory = [
		{ item: diamondAxe, slot: 0 },
		{ item: leap, slot: 1 },
		{ item: sppedBuff, slot: 2 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	return kit;
}
