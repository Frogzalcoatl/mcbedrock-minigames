import {
	type Container,
	type Entity,
	EntityComponentTypes,
	type EntityEquippableComponent,
	EquipmentSlot,
	type ItemStack,
} from "@minecraft/server";

export function removeItem(container: Container, item: ItemStack, amount: number): void {
	const itemIndex = container.find(item);
	if (itemIndex === undefined) {
		return;
	}
	const inventoryItem = container.getItem(itemIndex);
	if (inventoryItem === undefined) {
		return;
	}
	if (inventoryItem.amount < amount) {
		container.setItem(itemIndex);
		removeItem(container, item, amount - inventoryItem.amount);
	} else if (inventoryItem.amount === amount) {
		container.setItem(itemIndex);
	} else {
		inventoryItem.amount -= amount;
		container.setItem(itemIndex, inventoryItem);
	}
}

export function decrementMainhandItem(entity: Entity): void {
	const equippable: EntityEquippableComponent | undefined = entity.getComponent(
		EntityComponentTypes.Equippable,
	);
	if (equippable === undefined) {
		return;
	}
	const mainhandItem: ItemStack | undefined = equippable.getEquipment(EquipmentSlot.Mainhand);
	if (mainhandItem === undefined) {
		return;
	}
	if (mainhandItem.amount === 1) {
		equippable.setEquipment(EquipmentSlot.Mainhand);
	} else {
		mainhandItem.amount--;
		equippable.setEquipment(EquipmentSlot.Mainhand, mainhandItem);
	}
}
