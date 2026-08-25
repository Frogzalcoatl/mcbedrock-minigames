import { type Entity, ItemLockMode, ItemStack, Player } from "@minecraft/server";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { giveItemToEntity } from "../../../entities/inventory";
import { setDurability } from "../../../items/utils/durability";
import { applyEnchant } from "../../../items/utils/enchant";
import type { Kit } from "../../../kits/kitManager";
import {
	kitArmorDurability,
	kitArmorEnchant,
	kitArmorLockMode,
	kitInventoryLockMode,
} from "../../../kits/utils";

function onKill(kitUser: Entity, _dead: Entity): void {
	const arrows = new ItemStack(MinecraftItemTypes.Arrow, 4);
	arrows.lockMode = ItemLockMode.inventory;
	giveItemToEntity(arrows, kitUser, false);
	if (kitUser instanceof Player) {
		kitUser.sendMessage("§7+4 Arrow");
	}
}

export function getKitSkirmisher(): Kit {
	const kit: Kit = {
		boots: new ItemStack(MinecraftItemTypes.LeatherBoots),
		chestplate: new ItemStack(MinecraftItemTypes.CopperChestplate),
		helmet: new ItemStack(MinecraftItemTypes.LeatherHelmet),
		icon: "textures/items/bow_standby.png",
		inventory: [],
		leggings: new ItemStack(MinecraftItemTypes.ChainmailLeggings),
		name: "Skirmisher",
	};
	kitArmorEnchant(kit, MinecraftEnchantmentTypes.Protection, 4);
	kitArmorDurability(kit, "unbreakable");
	kitArmorLockMode(kit, ItemLockMode.slot);
	const woodenSword = new ItemStack(MinecraftItemTypes.WoodenSword);
	setDurability(woodenSword, "unbreakable");
	applyEnchant(woodenSword, MinecraftEnchantmentTypes.Sharpness, 2);
	const bow = new ItemStack(MinecraftItemTypes.Bow);
	setDurability(bow, "unbreakable");
	applyEnchant(bow, MinecraftEnchantmentTypes.Power, 3);
	const crossbow = new ItemStack(MinecraftItemTypes.Crossbow);
	setDurability(crossbow, "unbreakable");
	applyEnchant(crossbow, MinecraftEnchantmentTypes.Multishot);
	applyEnchant(crossbow, MinecraftEnchantmentTypes.QuickCharge, 3);
	const arrows = new ItemStack(MinecraftItemTypes.Arrow, 32);
	kit.inventory = [
		{ item: woodenSword, slot: 0 },
		{ item: bow, slot: 1 },
		{ item: crossbow, slot: 2 },
		{ item: crossbow, slot: 3 },
		{ item: crossbow, slot: 4 },
		{ item: arrows, slot: 8 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	kit.onKill = onKill;
	return kit;
}
