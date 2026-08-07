import { ItemLockMode, ItemStack, type ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { joinKitPvpArena } from "../games/kitPvp/joinArena";
import { showKitsForm } from "../games/kitPvp/kitsForm";
import roomTypeIds from "../roomTypeIds";
import { itemNameMatches } from "./utils/matches";

const typeId: string = MinecraftItemTypes.TotemOfUndying;
const nameTag: string = "§r§eKit Select";

export function itemKitPvpSelect(): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	item.lockMode = ItemLockMode.inventory;
	return item;
}

export async function itemKitPvpSelectRun(event: ItemUseAfterEvent): Promise<void> {
	if (!itemNameMatches(event.itemStack, typeId, nameTag)) {
		return;
	}
	const selectedKitIndex: number | undefined = await showKitsForm(
		event.source,
		roomTypeIds.kitPvp,
	);
	if (selectedKitIndex === undefined) {
		return;
	}
	joinKitPvpArena(event.source, selectedKitIndex);
}
