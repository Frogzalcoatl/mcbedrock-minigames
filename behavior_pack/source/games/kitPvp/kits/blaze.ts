import { type Entity, ItemLockMode, ItemStack, type Player } from "@minecraft/server";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { giveItemToEntity } from "../../../entities/inventory";
import { itemBlazeFireball } from "../../../items/games/kitPvp/blazeFireballs";
import { itemFireStick } from "../../../items/games/kitPvp/fireStick";
import { setDurability } from "../../../items/utils/durability";
import type { Kit } from "../../../kits/kitManager";
import {
	kitArmorDurability,
	kitArmorEnchant,
	kitArmorLockMode,
	kitInventoryLockMode,
} from "../../../kits/utils";

function onKill(kitUser: Player, _dead: Entity): void {
	const fireballs: ItemStack = itemBlazeFireball();
	fireballs.lockMode = ItemLockMode.inventory;
	fireballs.amount = 4;
	giveItemToEntity(fireballs, kitUser, false);
}

export function getKitBlaze(): Kit {
	const kit: Kit = {
		boots: new ItemStack(MinecraftItemTypes.LeatherBoots),
		chestplate: new ItemStack(MinecraftItemTypes.GoldenChestplate),
		helmet: new ItemStack(MinecraftItemTypes.LeatherHelmet),
		icon: "textures/items/blaze_rod.png",
		inventory: [],
		leggings: new ItemStack(MinecraftItemTypes.GoldenLeggings),
		name: "Blaze",
	};
	kitArmorEnchant(kit, MinecraftEnchantmentTypes.Protection, 1);
	kitArmorDurability(kit, "unbreakable");
	kitArmorLockMode(kit, ItemLockMode.slot);
	const goldenSword = new ItemStack(MinecraftItemTypes.GoldenSword);
	setDurability(goldenSword, "unbreakable");
	const fireballs: ItemStack = itemBlazeFireball();
	fireballs.amount = 16;
	const fireStick = itemFireStick();
	kit.inventory = [
		{ item: goldenSword, slot: 0 },
		{ item: fireballs, slot: 1 },
		{ item: fireStick, slot: 2 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	kit.onKill = onKill;
	return kit;
}
