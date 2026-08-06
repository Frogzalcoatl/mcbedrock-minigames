import { world } from "@minecraft/server";
import { itemBlazeFireballRun } from "../blazeFireballs";
import { itemKitSelectRun } from "../hubItems";

world.afterEvents.itemUse.subscribe((event) => {
	itemKitSelectRun(event);
	itemBlazeFireballRun(event);
});
