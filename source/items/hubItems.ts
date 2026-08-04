import { ItemLockMode, ItemStack, world } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { showKitsForm } from "../games/kitPvp/ui";

export let KitItem: ItemStack | undefined;

world.afterEvents.worldLoad.subscribe(() => {
	KitItem = new ItemStack(MinecraftItemTypes.TotemOfUndying);
	KitItem.nameTag = "§r§eKit Selection";
	KitItem.lockMode = ItemLockMode.inventory;
});

world.afterEvents.itemUse.subscribe((e) => {
	if (
		KitItem !== undefined &&
		e.itemStack.typeId === KitItem.typeId &&
		e.itemStack.nameTag === KitItem.nameTag
	) {
		showKitsForm(e.source);
	}
});
