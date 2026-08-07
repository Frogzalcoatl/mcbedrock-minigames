import { type ItemUseAfterEvent, world } from "@minecraft/server";
import { itemBlazeFireballRun } from "../blazeFireballs";
import { itemBreezeLeapRun } from "../breezeLeap";
import { itemKitPvpSelectRun } from "../kitPvpSelect";
import { itemTeleporterRun } from "../teleporter";

export function handleItemUse(event: ItemUseAfterEvent): void {
	itemTeleporterRun(event);
	itemKitPvpSelectRun(event);
	itemBlazeFireballRun(event);
	itemBreezeLeapRun(event);
}

world.afterEvents.itemUse.subscribe(handleItemUse);
