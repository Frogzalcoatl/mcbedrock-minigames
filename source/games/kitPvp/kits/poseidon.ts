import { type Entity, ItemLockMode, ItemStack, type Player } from "@minecraft/server";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { giveItemToEntity } from "../../../entities/inventory";
import { itemLightningStick } from "../../../items/games/kitPvp/lightningStick";
import { itemPoseidenBuff } from "../../../items/games/kitPvp/poseidenBuff";
import { setDurability } from "../../../items/utils/durability";
import { applyEnchant } from "../../../items/utils/enchant";
import type { Kit } from "../../../kits/kitManager";
import {
	kitArmorDurability,
	kitArmorEnchant,
	kitArmorLockMode,
	kitInventoryLockMode,
} from "../../../kits/utils";

function onKill(kitUser: Player, _dead: Entity): void {
	const buff = itemPoseidenBuff();
	giveItemToEntity(buff, kitUser, false);
}

export function getKitPoseidon(): Kit {
	const kit: Kit = {
		boots: new ItemStack(MinecraftItemTypes.LeatherBoots),
		chestplate: new ItemStack(MinecraftItemTypes.ChainmailChestplate),
		helmet: new ItemStack(MinecraftItemTypes.TurtleHelmet),
		icon: "textures/items/trident.png",
		inventory: [],
		leggings: new ItemStack(MinecraftItemTypes.LeatherLeggings),
		name: "Poseidon",
	};
	kitArmorEnchant(kit, MinecraftEnchantmentTypes.Protection, 1);
	kitArmorDurability(kit, "unbreakable");
	kitArmorLockMode(kit, ItemLockMode.slot);
	const trident = new ItemStack(MinecraftItemTypes.Trident);
	applyEnchant(trident, MinecraftEnchantmentTypes.Loyalty, 3);
	setDurability(trident, "unbreakable");
	const buff: ItemStack = itemPoseidenBuff();
	const lightning: ItemStack = itemLightningStick();
	kit.inventory = [
		{ item: trident, slot: 0 },
		{ item: buff, slot: 1 },
		{ item: lightning, slot: 2 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	kit.onKill = onKill;
	return kit;
}
