import type { ItemStack, ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftEntityTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { spawnTemporaryMount } from "../../../entities/mount";
import { itemUseMap } from "../../events/itemUse";
import { itemCooldownCheck, itemCooldownSet } from "../../utils/cooldown";
import { defaultItemStackFunc } from "../../utils/default";

const typeId: string = MinecraftItemTypes.ZombieHorseSpawnEgg;
const nameTag: string = "§r§dZombie Horse §7(Use)";
itemCooldownSet(nameTag, typeId, 20 * 15, true);
const horseRideDurationTicks: number = 20 * 8;

itemUseMap.set(nameTag, {
	callback: (event: ItemUseAfterEvent): void => {
		if (itemCooldownCheck(event.source, event.itemStack)) {
			spawnTemporaryMount(
				MinecraftEntityTypes.ZombieHorse,
				event.source,
				horseRideDurationTicks,
				MinecraftItemTypes.NetheriteHorseArmor,
			);
		}
	},
	typeId: typeId,
});

export function itemZombieHorse(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}
