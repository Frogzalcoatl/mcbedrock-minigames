import { type ItemUseAfterEvent, world } from "@minecraft/server";
import { itemBlazeFireballRun } from "../blazeFireballs";
import { itemBreezeLeapRun } from "../breezeLeap";
import { itemKitPvpSelectRun } from "../kitPvpSelect";
import { itemLancerLeapRun } from "../lancerLeap";
import { itemLightningStickRun } from "../lightningStick";
import { itemPoisonFishProjectileRun } from "../poisonFishProjectile";
import { itemPoseidenBuffRun } from "../poseidenBuff";
import { itemTeleporterRun } from "../teleporter";
import { itemZombieHorseRun } from "../zombieHorse";

export function itemUseHandler(event: ItemUseAfterEvent): void {
	itemTeleporterRun(event);
	itemKitPvpSelectRun(event);
	itemBlazeFireballRun(event);
	itemBreezeLeapRun(event);
	itemLancerLeapRun(event);
	itemZombieHorseRun(event);
	itemPoisonFishProjectileRun(event);
	itemLightningStickRun(event);
	itemPoseidenBuffRun(event);
}

world.afterEvents.itemUse.subscribe(itemUseHandler);
