import { type Entity, ItemLockMode, ItemStack, type Player } from "@minecraft/server";
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

const ICE_BOMB_ID: string = "minecraft:ice_bomb";

function onKill(kitUser: Player, _dead: Entity): void {
	const snowballs = new ItemStack(MinecraftItemTypes.Snowball, 2);
	snowballs.lockMode = ItemLockMode.inventory;
	giveItemToEntity(snowballs, kitUser, false);
	const iceBomb = new ItemStack(ICE_BOMB_ID);
	iceBomb.lockMode = ItemLockMode.inventory;
	giveItemToEntity(iceBomb, kitUser, false);
}

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
	kitArmorEnchant(kit, MinecraftEnchantmentTypes.Protection, 4);
	kitArmorDurability(kit, "unbreakable");
	kitArmorLockMode(kit, ItemLockMode.slot);
	const ironSword = new ItemStack(MinecraftItemTypes.IronSword);
	setDurability(ironSword, "unbreakable");
	applyEnchant(ironSword, MinecraftEnchantmentTypes.Sharpness, 2);
	const iceBomb = new ItemStack(ICE_BOMB_ID, 4);
	kit.inventory = [
		{ item: ironSword, slot: 0 },
		{ item: new ItemStack(MinecraftItemTypes.Snowball, 12), slot: 1 },
		{ item: iceBomb, slot: 2 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	kit.onKill = onKill;
	return kit;
}
