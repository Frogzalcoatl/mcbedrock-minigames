import {
	type Entity,
	EntityComponentTypes,
	type EntityInventoryComponent,
	ItemLockMode,
	ItemStack,
	Player,
} from "@minecraft/server";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { setDurability } from "../../../items/utils/durability";
import { applyEnchant } from "../../../items/utils/enchant";
import { giveItem } from "../../../items/utils/give";
import type { Kit } from "../../../kits/kitManager";
import {
	kitArmorDurability,
	kitArmorEnchant,
	kitArmorLockMode,
	kitInventoryLockMode,
} from "../../../kits/utils";
import { ICE_BOMB_ID } from "../../../constants";

function onKill(kitUser: Entity, _dead: Entity): void {
	const inventory: EntityInventoryComponent | undefined = kitUser.getComponent(
		EntityComponentTypes.Inventory,
	);
	if (inventory === undefined) {
		return;
	}
	const snowballs = new ItemStack(MinecraftItemTypes.Snowball, 2);
	snowballs.lockMode = ItemLockMode.inventory;
	const iceBomb = new ItemStack(ICE_BOMB_ID);
	iceBomb.lockMode = ItemLockMode.inventory;
	giveItem(snowballs, inventory.container, kitUser.location, kitUser.dimension, false);
	giveItem(iceBomb, inventory.container, kitUser.location, kitUser.dimension, false);
	if (kitUser instanceof Player) {
		kitUser.sendMessage("§7+2 Snowball");
		kitUser.sendMessage("§7+1 Ice Bomb");
	}
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
