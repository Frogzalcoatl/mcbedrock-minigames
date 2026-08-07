import { ItemLockMode, ItemStack, type Player } from "@minecraft/server";
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

export function isItemKitPvpSelect(item: ItemStack): boolean {
	return itemNameMatches(item, typeId, nameTag);
}

export async function itemKitPvpSelectRun(source: Player): Promise<void> {
	const selectedKitIndex: number | undefined = await showKitsForm(source, roomTypeIds.kitPvp);
	if (selectedKitIndex === undefined) {
		return;
	}
	joinKitPvpArena(source, selectedKitIndex);
}
