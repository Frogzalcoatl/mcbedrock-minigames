import {
	type Entity,
	EntityComponentTypes,
	type EntityInventoryComponent,
	ItemLockMode,
	ItemStack,
	Player,
} from "@minecraft/server";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { itemLightning } from "../../../items/games/kitPvp/lightning";
import { itemPoseidonBuff } from "../../../items/games/kitPvp/poseidonBuff";
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

function onKill(kitUser: Entity, _dead: Entity): void {
	const inventory: EntityInventoryComponent | undefined = kitUser.getComponent(
		EntityComponentTypes.Inventory,
	);
	if (inventory === undefined) {
		return;
	}
	const buff = itemPoseidonBuff();
	buff.lockMode = ItemLockMode.inventory;
	const lightning: ItemStack = itemLightning();
	lightning.lockMode = ItemLockMode.inventory;
	giveItem(buff, inventory.container, kitUser.location, kitUser.dimension, false);
	giveItem(lightning, inventory.container, kitUser.location, kitUser.dimension, false);
	if (kitUser instanceof Player) {
		kitUser.sendMessage("§7+1 Poseidon Buff");
		kitUser.sendMessage("§7+1 Lightning");
	}
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
	kitArmorEnchant(kit, MinecraftEnchantmentTypes.Protection, 4);
	kitArmorDurability(kit, "unbreakable");
	kitArmorLockMode(kit, ItemLockMode.slot);
	const trident = new ItemStack(MinecraftItemTypes.Trident);
	applyEnchant(trident, MinecraftEnchantmentTypes.Loyalty, 3);
	setDurability(trident, "unbreakable");
	const buff: ItemStack = itemPoseidonBuff();
	buff.amount = 2;
	const lightning: ItemStack = itemLightning();
	lightning.amount = 4;
	kit.inventory = [
		{ item: trident, slot: 0 },
		{ item: buff, slot: 1 },
		{ item: lightning, slot: 2 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	kit.onKill = onKill;
	return kit;
}
