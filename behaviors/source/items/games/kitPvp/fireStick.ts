import type { Entity, ItemStack } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { itemEntityHitMap } from "../../events/entityHitEntity";
import { defaultItemStackFunc } from "../../utils/default";

const typeId: string = MinecraftItemTypes.BlazeRod;
const nameTag: string = "§r§eFire Stick";

export function itemFireStick(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}

itemEntityHitMap.set(nameTag, {
	callback: (_mainhandItem: ItemStack, _damagingEntity: Entity, hitEntity: Entity): void => {
		if (hitEntity.isValid) {
			hitEntity.setOnFire(10, false);
		}
	},
	typeId: typeId,
});
