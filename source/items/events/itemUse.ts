import { world } from "@minecraft/server";
import { itemBlazeFireballRun } from "../blazeFireballs";
import { itemTeleporterRun } from "../hubItems";

world.afterEvents.itemUse.subscribe((event) => {
	itemTeleporterRun(event);
	itemBlazeFireballRun(event);
});
