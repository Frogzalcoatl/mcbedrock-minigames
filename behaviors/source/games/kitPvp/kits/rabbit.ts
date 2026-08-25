import { type Entity, ItemLockMode, ItemStack, Player } from "@minecraft/server";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { giveItemToEntity } from "../../../entities/inventory";
import { itemRabbitGoldenCarrot } from "../../../items/games/kitPvp/rabbitBuff";
import { itemRabbitLeap } from "../../../items/games/kitPvp/rabbitLeap";
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
	const rabbitBuff: ItemStack = itemRabbitGoldenCarrot();
	rabbitBuff.lockMode = ItemLockMode.inventory;
	giveItemToEntity(rabbitBuff, kitUser, false);
	if (kitUser instanceof Player) {
		kitUser.sendMessage("§7+1 Golden Carrot");
	}
}

export function getKitRabbit(): Kit {
	const kit: Kit = {
		boots: new ItemStack(MinecraftItemTypes.LeatherBoots),
		chestplate: new ItemStack(MinecraftItemTypes.IronChestplate),
		helmet: new ItemStack(MinecraftItemTypes.LeatherHelmet),
		icon: "textures/items/rabbit_foot.png",
		inventory: [],
		leggings: new ItemStack(MinecraftItemTypes.ChainmailLeggings),
		name: "Rabbit",
	};
	kitArmorEnchant(kit, MinecraftEnchantmentTypes.Protection, 4);
	kitArmorDurability(kit, "unbreakable");
	kitArmorLockMode(kit, ItemLockMode.slot);
	const diamondAxe = new ItemStack(MinecraftItemTypes.DiamondAxe);
	setDurability(diamondAxe, "unbreakable");
	applyEnchant(diamondAxe, MinecraftEnchantmentTypes.Sharpness, 2);
	const leap: ItemStack = itemRabbitLeap();
	const goldenCarrot: ItemStack = itemRabbitGoldenCarrot();
	goldenCarrot.amount = 2;
	kit.inventory = [
		{ item: diamondAxe, slot: 0 },
		{ item: leap, slot: 1 },
		{ item: goldenCarrot, slot: 2 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	kit.onKill = onKill;
	return kit;
}
