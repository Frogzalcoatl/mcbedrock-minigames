import { type Entity, ItemLockMode, ItemStack, Player } from "@minecraft/server";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { giveItemToEntity } from "../../../entities/inventory";
import { itemPoisonFishProjectile as itemPufferfishProjectile } from "../../../items/games/kitPvp/pufferfishProjectile";
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
	const pufferFish: ItemStack = itemPufferfishProjectile();
	pufferFish.lockMode = ItemLockMode.inventory;
	giveItemToEntity(pufferFish, kitUser, false);
	if (kitUser instanceof Player) {
		kitUser.sendMessage("§7+1 Pufferfish");
	}
}

export function getKitFisherman(): Kit {
	const kit: Kit = {
		boots: new ItemStack(MinecraftItemTypes.CopperBoots),
		chestplate: new ItemStack(MinecraftItemTypes.CopperChestplate),
		helmet: new ItemStack(MinecraftItemTypes.CopperHelmet),
		icon: "textures/items/fishing_rod_uncast.png",
		inventory: [],
		leggings: new ItemStack(MinecraftItemTypes.CopperLeggings),
		name: "Fisherman",
	};
	kitArmorEnchant(kit, MinecraftEnchantmentTypes.Protection, 4);
	kitArmorDurability(kit, "unbreakable");
	kitArmorLockMode(kit, ItemLockMode.slot);
	const copperSword = new ItemStack(MinecraftItemTypes.CopperSword);
	setDurability(copperSword, "unbreakable");
	applyEnchant(copperSword, MinecraftEnchantmentTypes.Sharpness, 2);
	const fishingRod = new ItemStack(MinecraftItemTypes.FishingRod);
	setDurability(fishingRod, "unbreakable");
	const pufferfish: ItemStack = itemPufferfishProjectile();
	pufferfish.amount = 4;
	kit.inventory = [
		{ item: copperSword, slot: 0 },
		{ item: fishingRod, slot: 1 },
		{ item: pufferfish, slot: 2 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	kit.onKill = onKill;
	return kit;
}
