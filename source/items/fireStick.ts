import { type Entity, ItemStack } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { itemNameMatches } from "./utils/matches";

const typeId: string = MinecraftItemTypes.BlazeRod;
const nameTag: string = "§r§eFire Sitck";

export function itemFireStick(): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	return item;
}

export function itemFireStickRun(mainhandItem: ItemStack, hitEntity: Entity): void {
	if (hitEntity.isValid && itemNameMatches(mainhandItem, typeId, nameTag)) {
		hitEntity.setOnFire(5);
	}
}
