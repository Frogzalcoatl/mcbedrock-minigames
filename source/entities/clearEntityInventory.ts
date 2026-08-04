import {
	type Entity,
	EntityComponentTypes,
	type EntityEquippableComponent,
	type EntityInventoryComponent,
	EquipmentSlot,
} from "@minecraft/server";

export function clearEntityInventory(entity: Entity): void {
	const inventory: EntityInventoryComponent | undefined = entity.getComponent(
		EntityComponentTypes.Inventory,
	);
	if (inventory?.isValid && inventory.container.isValid) {
		inventory.container.clearAll();
	}
	const equippable: EntityEquippableComponent | undefined = entity.getComponent(
		EntityComponentTypes.Equippable,
	);
	if (equippable?.isValid) {
		equippable.setEquipment(EquipmentSlot.Head);
		equippable.setEquipment(EquipmentSlot.Chest);
		equippable.setEquipment(EquipmentSlot.Legs);
		equippable.setEquipment(EquipmentSlot.Feet);
		equippable.setEquipment(EquipmentSlot.Offhand);
	}
}
