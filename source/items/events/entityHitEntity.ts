import {
	EntityComponentTypes,
	type EntityEquippableComponent,
	type EntityHitEntityAfterEvent,
	EquipmentSlot,
	type ItemStack,
	world,
} from "@minecraft/server";
import { itemFireStickRun } from "../fireStick";

function handleDamagingEquippable(
	event: EntityHitEntityAfterEvent,
	equippable: EntityEquippableComponent,
): void {
	const mainhandItem: ItemStack | undefined = equippable.getEquipment(EquipmentSlot.Mainhand);
	if (mainhandItem !== undefined) {
		itemFireStickRun(mainhandItem, event.hitEntity);
	}
}

world.afterEvents.entityHitEntity.subscribe((event) => {
	const equippableDamaging: EntityEquippableComponent | undefined =
		event.damagingEntity.getComponent(EntityComponentTypes.Equippable);
	if (equippableDamaging !== undefined) {
		handleDamagingEquippable(event, equippableDamaging);
	}
});
