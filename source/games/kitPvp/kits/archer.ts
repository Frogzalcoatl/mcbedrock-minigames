import { type Entity, ItemLockMode, ItemStack } from "@minecraft/server";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { giveItemToEntity } from "../../../entities/container";
import { setDurability } from "../../../items/utils/durability";
import type { Kit } from "../kitManager";
import {
	kitArmorDurability,
	kitArmorEnchant,
	kitArmorLockMode,
	kitInventoryLockMode,
} from "../utils";

function onKill(kitUser: Entity, _dead: Entity): void {
	const arrows = new ItemStack(MinecraftItemTypes.Arrow, 4);
	arrows.lockMode = ItemLockMode.inventory;
	giveItemToEntity(arrows, kitUser, false);
}

export function getKitArcher(): Kit {
	const kit: Kit = {
		boots: new ItemStack(MinecraftItemTypes.LeatherBoots),
		chestplate: new ItemStack(MinecraftItemTypes.CopperChestplate),
		helmet: new ItemStack(MinecraftItemTypes.LeatherHelmet),
		icon: "textures/items/bow_standby.png",
		inventory: [],
		leggings: new ItemStack(MinecraftItemTypes.ChainmailLeggings),
		name: "Archer",
	};
	kitArmorEnchant(kit, MinecraftEnchantmentTypes.Protection, 1);
	kitArmorDurability(kit, "unbreakable");
	kitArmorLockMode(kit, ItemLockMode.slot);
	const woodenSword = new ItemStack(MinecraftItemTypes.WoodenSword);
	setDurability(woodenSword, "unbreakable");
	const bow = new ItemStack(MinecraftItemTypes.Bow);
	setDurability(bow, "unbreakable");
	const arrows = new ItemStack(MinecraftItemTypes.Arrow, 16);
	kit.inventory = [
		{ item: woodenSword, slot: 0 },
		{ item: bow, slot: 1 },
		{ item: arrows, slot: 8 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	kit.onKill = onKill;
	return kit;
}
