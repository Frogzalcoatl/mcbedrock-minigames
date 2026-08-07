import { ItemLockMode, ItemStack, type ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { showRoomTypeForm } from "../rooms/roomTypeForm";
import { itemNameMatches } from "./utils/matches";

const typeId: string = MinecraftItemTypes.Compass;
const nameTag: string = "§r§dTeleporter §7(Use)";

export function itemTeleporter(): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	item.lockMode = ItemLockMode.inventory;
	return item;
}

export function itemTeleporterRun(event: ItemUseAfterEvent): void {
	if (itemNameMatches(event.itemStack, typeId, nameTag)) {
		showRoomTypeForm(event.source);
	}
}
