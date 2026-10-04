import {
	ItemLockMode,
	type ItemStack,
	type ItemUseAfterEvent,
	type PlayerSwingStartAfterEvent,
} from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { tools } from "../tools";
import { roomTypeIds } from "../tools/constants";
import { defaultItemStackFunc } from "../tools/helpers/entityComponents";
import { RoomType } from "../tools/room/roomType";

const typeId: string = MinecraftItemTypes.RedDye;
const nameTag: string = "§r§cLeave";

tools.items.onUse(nameTag, typeId, (event: ItemUseAfterEvent): void => {
	RoomType.join(roomTypeIds.hub, event.source);
});

tools.items.onSwing(nameTag, typeId, (event: PlayerSwingStartAfterEvent): void => {
	RoomType.join(roomTypeIds.hub, event.player);
});

export function itemLeaveGame(): ItemStack {
	const item: ItemStack = defaultItemStackFunc(typeId, nameTag);
	item.lockMode = ItemLockMode.inventory;
	return item;
}
