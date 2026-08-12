import { world } from "@minecraft/server";
import { itemBlazeFireballRun } from "../blazeFireballs";
import { itemBreezeLeapRun } from "../breezeLeap";
import { itemKitPvpSelectRun } from "../kitPvpSelect";
import { itemLancerLeapRun } from "../lancerLeap";
import { itemTeleporterRun } from "../teleporter";
import { itemZombieHorseRun } from "../zombieHorse";

world.afterEvents.itemUse.subscribe((event) => {
	itemTeleporterRun(event);
	itemKitPvpSelectRun(event);
	itemBlazeFireballRun(event);
	itemBreezeLeapRun(event);
	itemLancerLeapRun(event);
	itemZombieHorseRun(event);
});
