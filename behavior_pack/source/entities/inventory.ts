import {
	type Entity,
	EntityComponentTypes,
	type EntityEquippableComponent,
	type EntityInventoryComponent,
	EquipmentSlot,
	type ItemStack,
} from "@minecraft/server";
import { giveItem } from "../items/utils/give";

export function giveItemToEntity(
	item: ItemStack,
	entity: Entity,
	spawnOverflowItems: boolean,
): void {
	const inventory: EntityInventoryComponent | undefined = entity.getComponent(
		EntityComponentTypes.Inventory,
	);
	if (inventory === undefined) {
		return;
	}
	giveItem(item, inventory.container, entity.location, entity.dimension, spawnOverflowItems);
}

export function clearEntityInventory(entity: Entity): void {
	const inventory: EntityInventoryComponent | undefined = entity.getComponent(
		EntityComponentTypes.Inventory,
	);
	if (inventory !== undefined) {
		inventory.container.clearAll();
	}
	const equippable: EntityEquippableComponent | undefined = entity.getComponent(
		EntityComponentTypes.Equippable,
	);
	if (equippable !== undefined) {
		equippable.setEquipment(EquipmentSlot.Head);
		equippable.setEquipment(EquipmentSlot.Chest);
		equippable.setEquipment(EquipmentSlot.Legs);
		equippable.setEquipment(EquipmentSlot.Feet);
		equippable.setEquipment(EquipmentSlot.Offhand);
	}
}
