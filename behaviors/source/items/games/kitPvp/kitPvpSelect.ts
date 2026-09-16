import {
	EntitySwingSource,
	ItemLockMode,
	ItemStack,
	type ItemUseAfterEvent,
	type Player,
	type PlayerSwingStartAfterEvent,
	world,
} from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { roomTypeIds } from "../../../constants";
import { joinKitPvpArena } from "../../../games/kitPvp/joinArena";
import { showFormKits } from "../../../kits/kits";
import { itemUseMap } from "../../events/itemUse";

const typeId: string = MinecraftItemTypes.TotemOfUndying;
const nameTag: string = "§r§eKit Select §7(Use)";

async function callback(player: Player): Promise<void> {
	const selectedKitIndex: number | undefined = await showFormKits(player, roomTypeIds.kitPvp);
	if (selectedKitIndex === undefined) {
		return;
	}
	joinKitPvpArena(player, selectedKitIndex);
}

itemUseMap.set(nameTag, {
	callback: (event: ItemUseAfterEvent): void => {
		callback(event.source);
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
			callback(event.player);
		}
	},
	{ swingSource: EntitySwingSource.Attack },
);

export function itemKitPvpSelect(): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	item.lockMode = ItemLockMode.inventory;
	return item;
}
