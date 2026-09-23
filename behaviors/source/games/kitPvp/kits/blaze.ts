import { type Entity, ItemLockMode, ItemStack, Player } from "@minecraft/server";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { itemBlazeFireball } from "../../../items/games/kitPvp/blazeFireballs";
import { itemFireStick } from "../../../items/games/kitPvp/fireStick";
import {
	type Kit,
	kitArmorDurability,
	kitArmorEnchant,
	kitArmorLockMode,
	kitInventoryLockMode,
} from "../../../tools/games/kits";
import { applyEnchant, giveItemToEntity, setDurability } from "../../../tools/helpers";

function onKill(kitUser: Entity, _dead: Entity): void {
	const fireballs: ItemStack = itemBlazeFireball();
	fireballs.lockMode = ItemLockMode.inventory;
	fireballs.amount = 4;
	giveItemToEntity(fireballs, kitUser, false);
	if (kitUser instanceof Player) {
		kitUser.sendMessage("§7+4 Fireball");
	}
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
	kitArmorEnchant(kit, MinecraftEnchantmentTypes.Protection, 4);
	kitArmorDurability(kit, "unbreakable");
	kitArmorLockMode(kit, ItemLockMode.slot);
	const goldenSword = new ItemStack(MinecraftItemTypes.GoldenSword);
	setDurability(goldenSword, "unbreakable");
	applyEnchant(goldenSword, MinecraftEnchantmentTypes.Sharpness, 3);
	const fireballs: ItemStack = itemBlazeFireball();
	fireballs.amount = 8;
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
