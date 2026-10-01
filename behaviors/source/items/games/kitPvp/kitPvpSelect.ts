import {
	EntitySwingSource,
	HeldItemOption,
	ItemLockMode,
	ItemStack,
	type ItemUseAfterEvent,
	type Player,
	type PlayerSwingStartAfterEvent,
	world,
} from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { kitPvpKits } from "../../../games/kitPvp";
import { joinKitPvpArena } from "../../../games/kitPvp/joinArena";
import { tools } from "../../../tools";
import type { Kit } from "../../../tools/kits";
import { itemUseMap } from "../../itemUse";

const typeId: string = MinecraftItemTypes.TotemOfUndying;
const nameTag: string = "§r§eKit Select §7(Use)";

async function callback(player: Player): Promise<void> {
	const selectedKit: Kit | undefined = await tools.kitManager.form(kitPvpKits, player);
	if (selectedKit !== undefined) {
		joinKitPvpArena(player, selectedKit);
	}
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
	{ heldItemOption: HeldItemOption.AnyItem, swingSource: EntitySwingSource.Attack },
);

export function itemKitPvpSelect(): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	item.lockMode = ItemLockMode.inventory;
	return item;
}
