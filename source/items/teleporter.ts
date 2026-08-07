import { ItemLockMode, ItemStack, type Player } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { showRoomTypesForm } from "../rooms/roomTypesForm";
import { itemNameMatches } from "./utils/matches";

const typeId: string = MinecraftItemTypes.Compass;
const nameTag: string = "§r§dTeleporter §7(Use)";

export function itemTeleporter(): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	item.lockMode = ItemLockMode.inventory;
	return item;
}

export function isItemTeleporter(item: ItemStack): boolean {
	return itemNameMatches(item, typeId, nameTag);
}

export function itemTeleporterRun(source: Player): void {
	showRoomTypesForm(source);
}
