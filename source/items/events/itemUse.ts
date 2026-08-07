import { type ItemUseAfterEvent, world } from "@minecraft/server";
import { isItemBlazeFireball, itemBlazeFireballRun } from "../blazeFireballs";
import { isItemKitPvpSelect, itemKitPvpSelectRun } from "../kitPvpSelect";
import { isItemTeleporter, itemTeleporterRun } from "../teleporter";

export function handleItemUse(event: ItemUseAfterEvent): void {
	if (isItemTeleporter(event.itemStack)) {
		itemTeleporterRun(event.source);
	}
	if (isItemKitPvpSelect(event.itemStack)) {
		itemKitPvpSelectRun(event.source);
	}
	if (isItemBlazeFireball(event.itemStack)) {
		itemBlazeFireballRun(event.source);
	}
}

world.afterEvents.itemUse.subscribe(handleItemUse);
