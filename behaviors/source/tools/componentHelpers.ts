import {
	type Container,
	type Dimension,
	type Enchantment,
	type EnchantmentType,
	EnchantmentTypes,
	type Entity,
	EntityComponentTypes,
	type EntityEquippableComponent,
	type EntityHealthComponent,
	type EntityInventoryComponent,
	EquipmentSlot,
	ItemComponentTypes,
	type ItemDurabilityComponent,
	type ItemEnchantableComponent,
	ItemStack,
	type Vector3,
} from "@minecraft/server";

const CONTAINER_TYPE_ID: string = "mg:container";

export function getDataValueItem(
	typeId: string,
	dataValue: number,
	originDimension: Dimension,
	originLocation: Vector3,
): ItemStack | null {
	if (!originDimension.isChunkLoaded(originLocation)) {
		return null;
	}
	const containerEntity: Entity = originDimension.spawnEntity(CONTAINER_TYPE_ID, originLocation);
	const inventory: EntityInventoryComponent | undefined = containerEntity.getComponent(
		EntityComponentTypes.Inventory,
	);
	if (inventory === undefined) {
		containerEntity.remove();
		return null;
	}
	containerEntity.runCommand(`/replaceitem entity @s slot.inventory 0 ${typeId} 1 ${dataValue}`);
	const dataValueItem: ItemStack | undefined = inventory.container.getItem(0);
	containerEntity.remove();
	if (dataValueItem === undefined) {
		return null;
	}
	return dataValueItem;
}

// was typing this everywhere so just created a func for it.
export function defaultItemStackFunc(typeId: string, nameTag: string): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	return item;
}

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

// spawnOverflowItems: When true, spawns item as entity if container is full
export function giveItem(
	item: ItemStack,
	container: Container,
	location: Vector3,
	dimension: Dimension,
	spawnOverflowItems: boolean,
): void {
	const overflow: ItemStack | undefined = container.addItem(item);
	if (spawnOverflowItems && overflow !== undefined && dimension.isChunkLoaded(location)) {
		// Avoids LocationOutOfWorldBoundariesError
		const spawnLocation: Vector3 = {
			x: location.x,
			y: dimension.heightRange.min,
			z: location.z,
		};
		dimension.spawnItem(overflow, spawnLocation).teleport(location);
	}
}

export function applyEnchant(item: ItemStack, id: string, level = 1): void {
	const enchantable: ItemEnchantableComponent | undefined = item.getComponent(
		ItemComponentTypes.Enchantable,
	);
	if (enchantable === undefined) {
		return;
	}
	const enchantType: EnchantmentType | undefined = EnchantmentTypes.get(id);
	if (enchantType === undefined) {
		return;
	}
	const enchantment: Enchantment = {
		level: level,
		type: enchantType,
	};
	enchantable.addEnchantment(enchantment);
}

export function setDurability(item: ItemStack, value: number | "unbreakable" | "max"): void {
	const durabilityComponent: ItemDurabilityComponent | undefined = item.getComponent(
		ItemComponentTypes.Durability,
	);
	if (durabilityComponent === undefined) {
		return;
	}
	if (value === "unbreakable") {
		durabilityComponent.unbreakable = true;
		return;
	}
	durabilityComponent.unbreakable = false;
	if (value === "max" || value > durabilityComponent.maxDurability) {
		durabilityComponent.damage = 0;
		return;
	}
	if (value < 0) {
		return;
	}
	durabilityComponent.unbreakable = false;
	durabilityComponent.damage = durabilityComponent.maxDurability - value;
}

export function clearEntityEffects(entity: Entity): void {
	for (const effect of entity.getEffects()) {
		entity.removeEffect(effect.typeId);
	}
}

export function changeEntityHealth(entity: Entity, by: number): void {
	const health: EntityHealthComponent | undefined = entity.getComponent(
		EntityComponentTypes.Health,
	);
	if (health === undefined) {
		return;
	}
	const newValue = health.currentValue + by;
	if (newValue > health.effectiveMax) {
		health.resetToMaxValue();
	} else if (newValue < health.effectiveMin) {
		health.resetToMinValue();
	} else {
		health.setCurrentValue(newValue);
	}
}

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
		equippable.setEquipment(EquipmentSlot.Head, undefined);
		equippable.setEquipment(EquipmentSlot.Chest, undefined);
		equippable.setEquipment(EquipmentSlot.Legs, undefined);
		equippable.setEquipment(EquipmentSlot.Feet, undefined);
		equippable.setEquipment(EquipmentSlot.Offhand, undefined);
	}
}
