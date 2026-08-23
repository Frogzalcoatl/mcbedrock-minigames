import type { ItemStack, ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftEntityTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { spawnHorseRide } from "../../../entities/horse";
import { itemUseMap } from "../../events/itemUse";
import { isItemCooldownFinished, setItemCooldown } from "../../utils/cooldown";
import { defaultItemStackFunc } from "../../utils/default";

const typeId: string = MinecraftItemTypes.ZombieHorseSpawnEgg;
const nameTag: string = "§r§dZombie Horse §7(Use)";
setItemCooldown(nameTag, typeId, 20 * 15, true);
export const itemZombieHorseCooldownTicks: number = 20 * 15;
const horseRideDurationTicks: number = 20 * 8;

export function itemZombieHorse(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}

itemUseMap.set(nameTag, {
	callback: (event: ItemUseAfterEvent): void => {
		if (!isItemCooldownFinished(event.source, event.itemStack)) {
			return;
		}
		spawnHorseRide(
			MinecraftEntityTypes.ZombieHorse,
			event.source,
			horseRideDurationTicks,
			MinecraftItemTypes.NetheriteHorseArmor,
		);
	},
	typeId: typeId,
});
