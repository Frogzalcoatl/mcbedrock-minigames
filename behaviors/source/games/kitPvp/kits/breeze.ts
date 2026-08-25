import { type Entity, ItemLockMode, ItemStack, Player } from "@minecraft/server";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { giveItemToEntity } from "../../../entities/inventory";
import { itemBreezeLeap } from "../../../items/games/kitPvp/breezeLeap";
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
	const windCharges = new ItemStack(MinecraftItemTypes.WindCharge, 1);
	windCharges.lockMode = ItemLockMode.inventory;
	giveItemToEntity(windCharges, kitUser, false);
	if (kitUser instanceof Player) {
		kitUser.sendMessage("§7+1 Wind Charge");
	}
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
	kitArmorEnchant(kit, MinecraftEnchantmentTypes.Protection, 4);
	kitArmorDurability(kit, "unbreakable");
	kitArmorLockMode(kit, ItemLockMode.slot);
	const mace = new ItemStack(MinecraftItemTypes.Mace);
	setDurability(mace, "unbreakable");
	applyEnchant(mace, MinecraftEnchantmentTypes.WindBurst);
	const breezeLeap = itemBreezeLeap();
	kit.inventory = [
		{ item: mace, slot: 0 },
		{ item: new ItemStack(MinecraftItemTypes.WindCharge, 2), slot: 1 },
		{ item: breezeLeap, slot: 2 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	kit.onKill = onKill;
	return kit;
}
