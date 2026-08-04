import { ItemLockMode, ItemStack, world } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { showKitsForm } from "../games/kitPvp/ui";
import { itemNameMatches } from "./utils/matches";

const typeId: string = MinecraftItemTypes.TotemOfUndying;
const nameTag: string = "§r§eKit Selection";

export function itemKitSelect(): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	item.lockMode = ItemLockMode.inventory;
	return item;
}

world.afterEvents.itemUse.subscribe((e) => {
	if (itemNameMatches(e.itemStack, typeId, nameTag)) {
		showKitsForm(e.source);
	}
});
