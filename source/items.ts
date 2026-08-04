import {
	EntityComponentTypes,
	type EntityInventoryComponent,
	ItemLockMode,
	ItemStack,
	world,
} from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { clearEntityInventory } from "./clearEntityInventory";
import { showDimensionNavForm } from "./dimensions";
import { showKitsForm } from "./kitPvp/ui";

let NavItem: ItemStack | undefined;
let KitItem: ItemStack | undefined;

world.afterEvents.worldLoad.subscribe(() => {
	NavItem = new ItemStack(MinecraftItemTypes.Compass);
	NavItem.nameTag = "§r§dDimension Navigation§r";
	NavItem.lockMode = ItemLockMode.inventory;
	KitItem = new ItemStack(MinecraftItemTypes.TotemOfUndying);
	KitItem.nameTag = "§r§eKit Selection";
	KitItem.lockMode = ItemLockMode.inventory;
});

world.afterEvents.playerSpawn.subscribe((e) => {
	clearEntityInventory(e.player);
	const inventory: EntityInventoryComponent | undefined = e.player.getComponent(
		EntityComponentTypes.Inventory,
	);
	if (inventory === undefined || !inventory.isValid || !inventory.container.isValid) {
		return;
	}
	if (NavItem !== undefined) {
		inventory.container.addItem(NavItem);
	}
	if (KitItem !== undefined) {
		inventory.container.addItem(KitItem);
	}
});

world.afterEvents.itemUse.subscribe((e) => {
	if (
		NavItem !== undefined &&
		e.itemStack.typeId === NavItem.typeId &&
		e.itemStack.nameTag === NavItem.nameTag
	) {
		showDimensionNavForm(e.source);
	}
	if (
		KitItem !== undefined &&
		e.itemStack.typeId === KitItem.typeId &&
		e.itemStack.nameTag === KitItem.nameTag
	) {
		showKitsForm(e.source);
	}
});
