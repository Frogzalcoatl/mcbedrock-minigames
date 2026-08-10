import type { Entity, ItemStack } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { defaultItemStackFunc } from "./utils/default";
import { itemNameMatches } from "./utils/matches";

const typeId: string = MinecraftItemTypes.BlazeRod;
const nameTag: string = "§r§eFire Sitck";

export function itemFireStick(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}

export function itemFireStickRun(mainhandItem: ItemStack, hitEntity: Entity): void {
	if (hitEntity.isValid && itemNameMatches(mainhandItem, typeId, nameTag)) {
		hitEntity.setOnFire(5);
	}
}
