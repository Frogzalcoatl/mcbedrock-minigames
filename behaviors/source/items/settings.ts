import {
	ItemLockMode,
	ItemStack,
	type ItemUseAfterEvent,
	type PlayerSwingStartAfterEvent,
} from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { showFormSettings } from "../forms/settings";
import { tools } from "../tools";

const typeId: string = MinecraftItemTypes.Comparator;
const nameTag: string = "§r§bWorld Settings §7(Use)";

tools.items.itemUseSet(nameTag, typeId, (event: ItemUseAfterEvent): void => {
	showFormSettings(event.source);
});

tools.items.itemSwingSet(nameTag, typeId, (event: PlayerSwingStartAfterEvent): void => {
	showFormSettings(event.player);
});

export function itemSettings(): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	item.lockMode = ItemLockMode.inventory;
	return item;
}
