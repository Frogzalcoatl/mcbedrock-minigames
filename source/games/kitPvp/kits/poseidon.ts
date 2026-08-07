import { type Entity, ItemLockMode, ItemStack, type Player } from "@minecraft/server";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { giveItemToEntity } from "../../../entities/inventory";
import { setDurability } from "../../../items/utils/durability";
import { applyEnchant } from "../../../items/utils/enchant";
import type { Kit } from "../../../kits/kitManager";
import {
	kitArmorDurability,
	kitArmorEnchant,
	kitArmorLockMode,
	kitInventoryLockMode,
} from "../../../kits/utils";
import type { Room } from "../../../rooms/room";
import { getPlayerRoom } from "../../../rooms/roomManager";

function onKill(kitUser: Player, _dead: Entity): void {
	const effectBuff = new ItemStack(MinecraftItemTypes.HeartOfTheSea);
	effectBuff.lockMode = ItemLockMode.inventory;
	effectBuff.nameTag = "§rEffect Buff";
	giveItemToEntity(effectBuff, kitUser, false);
}

function onDeath(kitUser: Player, _killer?: Entity): void {
	const room: Room | null = getPlayerRoom(kitUser);
	if (room === null) {
		return;
	}
	room.removePlayerProjectiles(kitUser);
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
	const effectBuff = new ItemStack(MinecraftItemTypes.HeartOfTheSea);
	effectBuff.nameTag = "§rEffect Buff";
	const lightning = new ItemStack(MinecraftItemTypes.EndRod);
	lightning.nameTag = "§rLightning";
	kit.inventory = [
		{ item: trident, slot: 0 },
		{ item: effectBuff, slot: 1 },
		{ item: lightning, slot: 2 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	kit.onKill = onKill;
	kit.onDeath = onDeath;
	return kit;
}
