import {
	EntitySwingSource,
	HeldItemOption,
	ItemLockMode,
	type ItemStack,
	type ItemUseAfterEvent,
	type PlayerSwingStartAfterEvent,
	world,
} from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { roomTypeIds } from "../../constants";
import { defaultItemStackFunc } from "../../tools/componentHelpers";
import { RoomType } from "../../tools/room/roomType";
import { itemUseMap } from "../events";

const typeId: string = MinecraftItemTypes.RedDye;
const nameTag: string = "§r§cLeave";

itemUseMap.set(nameTag, {
	callback: (event: ItemUseAfterEvent): void => {
		RoomType.join(roomTypeIds.hub, event.source);
	},
	typeId: typeId,
});

world.afterEvents.playerSwingStart.subscribe(
	(event: PlayerSwingStartAfterEvent) => {
		if (
			event.heldItemStack !== undefined &&
			event.heldItemStack.typeId === typeId &&
			event.heldItemStack.nameTag === nameTag
		) {
			RoomType.join(roomTypeIds.hub, event.player);
		}
	},
	{ heldItemOption: HeldItemOption.AnyItem, swingSource: EntitySwingSource.Attack },
);

export function itemLeaveGame(): ItemStack {
	const item: ItemStack = defaultItemStackFunc(typeId, nameTag);
	item.lockMode = ItemLockMode.inventory;
	return item;
}
