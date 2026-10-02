import {
	ItemLockMode,
	ItemStack,
	type ItemUseAfterEvent,
	type PlayerSwingStartAfterEvent,
} from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { showFormTeleporter } from "../forms/teleporter";
import { tools } from "../tools";

const typeId: string = MinecraftItemTypes.Compass;
const nameTag: string = "§r§dTeleporter §7(Use)";

tools.items.itemUseSet(nameTag, typeId, (event: ItemUseAfterEvent): void => {
	showFormTeleporter(event.source);
});

tools.items.itemSwingSet(nameTag, typeId, (event: PlayerSwingStartAfterEvent): void => {
	showFormTeleporter(event.player);
});

export function itemTeleporter(): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	item.lockMode = ItemLockMode.inventory;
	return item;
}
