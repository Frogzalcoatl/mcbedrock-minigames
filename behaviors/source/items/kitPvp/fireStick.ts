import {
	EntityComponentTypes,
	type EntityEquippableComponent,
	type EntityHitEntityAfterEvent,
	EquipmentSlot,
	type ItemStack,
	world,
} from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { defaultItemStackFunc } from "../../tools/misc/componentHelpers";

const typeId: string = MinecraftItemTypes.BlazeRod;
const nameTag: string = "§r§eFire Stick";

world.afterEvents.entityHitEntity.subscribe((event: EntityHitEntityAfterEvent) => {
	const equippable: EntityEquippableComponent | undefined = event.damagingEntity.getComponent(
		EntityComponentTypes.Equippable,
	);
	if (equippable === undefined) {
		return;
	}
	const mainhandItem: ItemStack | undefined = equippable.getEquipment(EquipmentSlot.Mainhand);
	if (mainhandItem === undefined) {
		return;
	}
	if (
		mainhandItem.typeId === typeId &&
		mainhandItem.nameTag === nameTag &&
		event.hitEntity.isValid
	) {
		event.hitEntity.setOnFire(10, false);
	}
});

export function itemFireStick(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}
