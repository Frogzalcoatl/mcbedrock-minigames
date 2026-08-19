import { ItemLockMode, ItemStack, type ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { showFormTeleporter } from "../../../rooms/formTeleporter";
import { itemUseMap } from "../../events/itemUse";

const typeId: string = MinecraftItemTypes.Compass;
const nameTag: string = "§r§dTeleporter §7(Use)";

export function itemTeleporter(): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	item.lockMode = ItemLockMode.inventory;
	return item;
}

itemUseMap.set(nameTag, {
	callback: (event: ItemUseAfterEvent): void => {
		showFormTeleporter(event.source);
	},
	typeId: typeId,
});
