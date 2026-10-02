import {
	ItemLockMode,
	type ItemStack,
	type ItemUseAfterEvent,
	type PlayerSwingStartAfterEvent,
} from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { roomTypeIds } from "../constants";
import { tools } from "../tools";
import { defaultItemStackFunc } from "../tools/misc/componentHelpers";
import { RoomType } from "../tools/room/roomType";

const typeId: string = MinecraftItemTypes.RedDye;
const nameTag: string = "§r§cLeave";

tools.items.itemUseSet(nameTag, typeId, (event: ItemUseAfterEvent): void => {
	RoomType.join(roomTypeIds.hub, event.source);
});

tools.items.itemSwingSet(nameTag, typeId, (event: PlayerSwingStartAfterEvent): void => {
	RoomType.join(roomTypeIds.hub, event.player);
});

export function itemLeaveGame(): ItemStack {
	const item: ItemStack = defaultItemStackFunc(typeId, nameTag);
	item.lockMode = ItemLockMode.inventory;
	return item;
}
