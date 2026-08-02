import {
	type Container,
	EntityComponentTypes,
	type EntityInventoryComponent,
	ItemLockMode,
	ItemStack,
	system,
	world,
} from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { showDimensionNavForm } from "./dimensionNavForm";

let NavItem: ItemStack;
system.run(() => {
	NavItem = new ItemStack(MinecraftItemTypes.Compass);
	NavItem.nameTag = "§r§dDimension Navigation§r";
	NavItem.lockMode = ItemLockMode.inventory;
});

export function giveNavItem(container: Container): void {
	if (!container.isValid) {
		return;
	}
	try {
		container.addItem(NavItem);
	} catch (error) {
		if (error instanceof Error) {
			world.sendMessage(`§cFailed to give nav item to container: ${error.message}`);
		}
	}
}

world.afterEvents.playerSpawn.subscribe((e) => {
	const inv: EntityInventoryComponent | undefined = e.player.getComponent(
		EntityComponentTypes.Inventory,
	);
	if (inv) {
		giveNavItem(inv.container);
	}
});

world.afterEvents.itemUse.subscribe((e) => {
	if (e.itemStack.typeId === NavItem.typeId && e.itemStack.nameTag === NavItem.nameTag) {
		showDimensionNavForm(e.source);
	}
});
