import {
	ItemLockMode,
	ItemStack,
	type ItemUseAfterEvent,
	type Player,
	type PlayerSwingStartAfterEvent,
} from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { kitPvpKits } from "../../games/kitPvp";
import { joinKitPvpArena } from "../../games/kitPvp/joinArena";
import { tools } from "../../tools";
import type { Kit } from "../../tools/managers/kits";

const typeId: string = MinecraftItemTypes.TotemOfUndying;
const nameTag: string = "§r§eKit Select §7(Use)";

async function callback(player: Player): Promise<void> {
	const selectedKit: Kit | undefined = await tools.kitManager.form(kitPvpKits, player);
	if (selectedKit !== undefined) {
		joinKitPvpArena(player, selectedKit);
	}
}
tools.items.itemUseSet(nameTag, typeId, (event: ItemUseAfterEvent): void => {
	callback(event.source);
});

tools.items.itemSwingSet(nameTag, typeId, (event: PlayerSwingStartAfterEvent): void => {
	callback(event.player);
});

export function itemKitPvpSelect(): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	item.lockMode = ItemLockMode.inventory;
	return item;
}
