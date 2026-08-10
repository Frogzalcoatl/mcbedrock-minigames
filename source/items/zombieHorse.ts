import type { ItemStack, ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftEntityTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { spawnHorseRide } from "../entities/horse";
import { isItemCooldownFinished } from "./utils/cooldown";
import { defaultItemStackFunc } from "./utils/default";
import { itemNameMatches } from "./utils/matches";

const typeId: string = MinecraftItemTypes.ZombieHorseSpawnEgg;
const nameTag: string = "§r§dZombie Horse §7(Use)";
export const itemZombieHorseCooldownTicks: number = 20 * 15;
const horseRideDurationTicks: number = 20 * 8;

export function itemZombieHorse(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}

export function itemZombieHorseRun(event: ItemUseAfterEvent): void {
	if (
		itemNameMatches(event.itemStack, typeId, nameTag) &&
		isItemCooldownFinished(event.source, event.itemStack)
	) {
		spawnHorseRide(
			MinecraftEntityTypes.ZombieHorse,
			event.source,
			horseRideDurationTicks,
			MinecraftItemTypes.NetheriteHorseArmor,
		);
	}
}
