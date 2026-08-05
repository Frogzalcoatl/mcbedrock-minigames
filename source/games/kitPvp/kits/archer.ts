import {
	type DimensionLocation,
	EntityComponentTypes,
	type EntityInventoryComponent,
	ItemLockMode,
	ItemStack,
	type Vector3,
	world,
} from "@minecraft/server";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { setDurability } from "../../../items/utils/durability";
import { giveItem } from "../../../items/utils/give";
import { getEntityKit, type Kit } from "../kitManager";
import {
	kitArmorDurability,
	kitArmorEnchant,
	kitArmorLockMode,
	kitInventoryLockMode,
} from "../utils";

const kitName: string = "Archer";
const arrowsOnKill: number = 4;

export function getKitArcher(): Kit {
	const kit: Kit = {
		boots: new ItemStack(MinecraftItemTypes.LeatherBoots),
		chestplate: new ItemStack(MinecraftItemTypes.CopperChestplate),
		helmet: new ItemStack(MinecraftItemTypes.LeatherHelmet),
		icon: "textures/items/bow_standby.png",
		inventory: [],
		leggings: new ItemStack(MinecraftItemTypes.ChainmailLeggings),
		name: kitName,
	};
	kitArmorEnchant(kit, MinecraftEnchantmentTypes.Protection, 1);
	kitArmorDurability(kit, "unbreakable");
	kitArmorLockMode(kit, ItemLockMode.slot);
	const woodenSword = new ItemStack(MinecraftItemTypes.WoodenSword);
	setDurability(woodenSword, "unbreakable");
	const bow = new ItemStack(MinecraftItemTypes.Bow);
	setDurability(bow, "unbreakable");
	const arrows = new ItemStack(MinecraftItemTypes.Arrow, 16);
	kit.inventory = [
		{ item: woodenSword, slot: 0 },
		{ item: bow, slot: 1 },
		{ item: arrows, slot: 8 },
	];
	kitInventoryLockMode(kit, ItemLockMode.inventory);
	return kit;
}

world.afterEvents.entityDie.subscribe((e) => {
	if (e.damageSource.damagingEntity === undefined || !e.damageSource.damagingEntity.isValid) {
		return;
	}
	const killerKit: Kit | null = getEntityKit(e.damageSource.damagingEntity);
	if (killerKit === null || killerKit.name !== kitName) {
		return;
	}
	const inventory: EntityInventoryComponent | undefined =
		e.damageSource.damagingEntity.getComponent(EntityComponentTypes.Inventory);
	if (inventory === undefined || !inventory.isValid || !inventory.container.isValid) {
		return;
	}
	const arrows = new ItemStack(MinecraftItemTypes.Arrow, arrowsOnKill);
	arrows.lockMode = ItemLockMode.inventory;
	const v: Vector3 = e.damageSource.damagingEntity.location;
	const location: DimensionLocation = {
		dimension: e.damageSource.damagingEntity.dimension,
		x: v.x,
		y: v.y,
		z: v.z,
	};
	giveItem(arrows, inventory.container, location, false);
});
