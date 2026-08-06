import { type Entity, ItemLockMode, ItemStack } from "@minecraft/server";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { giveItemToEntity } from "../../../entities/container";
import { setDurability } from "../../../items/utils/durability";
import type { Kit } from "../../../kits/kitManager";
import {
	kitArmorDurability,
	kitArmorEnchant,
	kitArmorLockMode,
	kitInventoryLockMode,
} from "../../../kits/utils";

function onKill(kitUser: Entity, _dead: Entity): void {
	const windCharges = new ItemStack(MinecraftItemTypes.WindCharge, 2);
	windCharges.lockMode = ItemLockMode.inventory;
	giveItemToEntity(windCharges, kitUser, false);
}

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
	const breezeLeap = new ItemStack(MinecraftItemTypes.BreezeRod);
	breezeLeap.nameTag = "§rBreeze Leap";
	kit.inventory = [
		{ item: mace, slot: 0 },
		{ item: new ItemStack(MinecraftItemTypes.WindCharge, 8), slot: 1 },
		{ item: breezeLeap, slot: 2 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	kit.onKill = onKill;
	return kit;
}
