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
	const speedBuff = new ItemStack(MinecraftItemTypes.GoldenCarrot);
	speedBuff.lockMode = ItemLockMode.inventory;
	speedBuff.nameTag = "§rSpeed Buff";
	giveItemToEntity(speedBuff, kitUser, false);
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
	kitArmorEnchant(kit, MinecraftEnchantmentTypes.Protection, 1);
	kitArmorDurability(kit, "unbreakable");
	kitArmorLockMode(kit, ItemLockMode.slot);
	const diamondAxe = new ItemStack(MinecraftItemTypes.DiamondAxe);
	setDurability(diamondAxe, "unbreakable");
	const leap = new ItemStack(MinecraftItemTypes.RabbitFoot);
	leap.nameTag = "§rLeap";
	const speedBuff = new ItemStack(MinecraftItemTypes.GoldenCarrot);
	speedBuff.nameTag = "§rSpeed Buff";
	kit.inventory = [
		{ item: diamondAxe, slot: 0 },
		{ item: leap, slot: 1 },
		{ item: speedBuff, slot: 2 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	kit.onKill = onKill;
	return kit;
}
