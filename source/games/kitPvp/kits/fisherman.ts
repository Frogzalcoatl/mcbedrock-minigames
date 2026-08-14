import { type Entity, ItemLockMode, ItemStack, type Player } from "@minecraft/server";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { giveItemToEntity } from "../../../entities/inventory";
import { itemPoisonFishProjectile } from "../../../items/poisonFishProjectile";
import { setDurability } from "../../../items/utils/durability";
import type { Kit } from "../../../kits/kitManager";
import {
	kitArmorDurability,
	kitArmorEnchant,
	kitArmorLockMode,
	kitInventoryLockMode,
} from "../../../kits/utils";

function onKill(kitUser: Player, _dead: Entity): void {
	const pufferFish = new ItemStack(MinecraftItemTypes.Pufferfish);
	pufferFish.lockMode = ItemLockMode.inventory;
	pufferFish.nameTag = "§rPoison Projectile";
	giveItemToEntity(pufferFish, kitUser, false);
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
	kitArmorEnchant(kit, MinecraftEnchantmentTypes.Protection, 1);
	kitArmorDurability(kit, "unbreakable");
	kitArmorLockMode(kit, ItemLockMode.slot);
	const copperSword = new ItemStack(MinecraftItemTypes.CopperSword);
	setDurability(copperSword, "unbreakable");
	const fishingRod = new ItemStack(MinecraftItemTypes.FishingRod);
	setDurability(fishingRod, "unbreakable");
	kit.inventory = [
		{ item: copperSword, slot: 0 },
		{ item: fishingRod, slot: 1 },
		{ item: itemPoisonFishProjectile(), slot: 2 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	kit.onKill = onKill;
	return kit;
}
