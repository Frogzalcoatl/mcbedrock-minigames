import {
	EntitySwingSource,
	HeldItemOption,
	ItemLockMode,
	ItemStack,
	type ItemUseAfterEvent,
	type PlayerSwingStartAfterEvent,
	world,
} from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { showFormTeleporter } from "../../../forms/teleporter";
import { itemUseMap } from "../../events";

const typeId: string = MinecraftItemTypes.Compass;
const nameTag: string = "§r§dTeleporter §7(Use)";

itemUseMap.set(nameTag, {
	callback: (event: ItemUseAfterEvent): void => {
		showFormTeleporter(event.source);
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
			showFormTeleporter(event.player);
		}
	},
	{ heldItemOption: HeldItemOption.AnyItem, swingSource: EntitySwingSource.Attack },
);

export function itemTeleporter(): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	item.lockMode = ItemLockMode.inventory;
	return item;
}
