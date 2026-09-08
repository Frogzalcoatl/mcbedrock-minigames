import type { Entity, ItemStack } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { itemEntityHitMap } from "../../events/entityHitEntity";
import { defaultItemStackFunc } from "../../utils/default";

const typeId: string = MinecraftItemTypes.BlazeRod;
const nameTag: string = "§r§eFire Stick";

itemEntityHitMap.set(nameTag, {
	callback: (_mainhandItem: ItemStack, _damagingEntity: Entity, hitEntity: Entity): void => {
		if (hitEntity.isValid) {
			hitEntity.setOnFire(10, false);
		}
	},
	typeId: typeId,
});

export function itemFireStick(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}
