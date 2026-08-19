import { ItemLockMode, ItemStack, type ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { joinKitPvpArena } from "../../../games/kitPvp/joinArena";
import { showFormKits } from "../../../kits/formKits";
import roomTypeIds from "../../../roomTypeIds";
import { itemUseMap } from "../../events/itemUse";

const typeId: string = MinecraftItemTypes.TotemOfUndying;
const nameTag: string = "§r§eKit Select §7(Use)";

export function itemKitPvpSelect(): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	item.lockMode = ItemLockMode.inventory;
	return item;
}

itemUseMap.set(nameTag, {
	callback: async (event: ItemUseAfterEvent): Promise<void> => {
		const selectedKitIndex: number | undefined = await showFormKits(
			event.source,
			roomTypeIds.kitPvp,
		);
		if (selectedKitIndex === undefined) {
			return;
		}
		joinKitPvpArena(event.source, selectedKitIndex);
	},
	typeId: typeId,
});
