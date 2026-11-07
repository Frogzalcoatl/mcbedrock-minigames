/** biome-ignore-all lint/style/useExportsLast: Helper functions in between exports. */

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
	type EntityRideableComponent,
	type EntityRidingComponent,
	EquipmentSlot,
	ItemComponentTypes,
	type ItemDurabilityComponent,
	type ItemEnchantableComponent,
	type ItemStack,
	type Player,
	type Vector3,
} from "@minecraft/server";
import { MinecraftEffectTypes } from "@minecraft/vanilla-data";

export const MAX_EFFECT_DURATION: number = 2e7;

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

function addItem(
	item: ItemStack,
	container: Container,
	containerLocation: Vector3,
	containerDimension: Dimension,
	spawnOverflowItems: boolean,
): void {
	const leftoverItem: ItemStack | undefined = container.addItem(item);
	if (spawnOverflowItems && leftoverItem !== undefined) {
		containerDimension.spawnItem(leftoverItem, {
			x: containerLocation.x,
			y: containerLocation.y,
			z: containerLocation.z,
		});
	}
}

// spawnOverflowItems: When true, spawns item as entity if container is full
export function giveItem(
	item: ItemStack,
	container: Container,
	containerLocation: Vector3,
	containerDimension: Dimension,
	spawnOverflowItems: boolean,
): void {
	const existingIndex: number | undefined = container.find(item);
	if (existingIndex === undefined) {
		addItem(item, container, containerLocation, containerDimension, spawnOverflowItems);
		return;
	}
	const existingItem: ItemStack | undefined = container.getItem(existingIndex);
	if (existingItem === undefined) {
		addItem(item, container, containerLocation, containerDimension, spawnOverflowItems);
		return;
	}
	const newItemAmount: number = existingItem.amount + item.amount;
	if (existingItem.maxAmount >= newItemAmount) {
		existingItem.amount = newItemAmount;
		container.setItem(existingIndex, existingItem);
	} else {
		existingItem.amount = existingItem.maxAmount;
		container.setItem(existingIndex, existingItem);
		existingItem.amount = newItemAmount - existingItem.maxAmount;
		addItem(item, container, containerLocation, containerDimension, spawnOverflowItems);
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
	if (inventory !== undefined) {
		giveItem(item, inventory.container, entity.location, entity.dimension, spawnOverflowItems);
	}
}

export function clearEntityEquippable(entity: Entity): void {
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

export function clearEntityInventory(entity: Entity): void {
	const inventory: EntityInventoryComponent | undefined = entity.getComponent(
		EntityComponentTypes.Inventory,
	);
	if (inventory !== undefined) {
		inventory.container.clearAll();
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

// Resets health to max and applies saturation/weakness
export function hubEffectHelper(player: Player): void {
	clearEntityEffects(player);
	player.addEffect(MinecraftEffectTypes.Saturation, MAX_EFFECT_DURATION, {
		amplifier: 255,
		showParticles: false,
	});
	player.addEffect(MinecraftEffectTypes.Weakness, MAX_EFFECT_DURATION, {
		amplifier: 255,
		showParticles: false,
	});
	const health: EntityHealthComponent | undefined = player.getComponent(
		EntityComponentTypes.Health,
	);
	if (health !== undefined) {
		health.resetToMaxValue();
	}
}

export function ejectFromMount(entity: Entity): void {
	const riding: EntityRidingComponent | undefined = entity.getComponent(
		EntityComponentTypes.Riding,
	);
	if (riding === undefined || !riding.entityRidingOn.isValid) {
		return;
	}
	const rideable: EntityRideableComponent | undefined = riding.entityRidingOn.getComponent(
		EntityComponentTypes.Rideable,
	);
	if (rideable !== undefined) {
		rideable.ejectRider(entity);
	}
}
