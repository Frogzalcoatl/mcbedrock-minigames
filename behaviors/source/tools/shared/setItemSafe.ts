import type {
	Container,
	DimensionLocation,
	Entity,
	EntityEquippableComponent,
	EntityInventoryComponent,
	EquipmentSlot,
	ItemStack,
} from "@minecraft/server";

// These functions set an item to a slot, and returns the previous item to the owner.
// It accounts for full containers by spawning items as entities.

// Sets item slot in a container and adds previous item back to the container.
// Define containerLocation to spawn overflow from previous item as an entity when the container is full.
export function setItemSafe(
	container: Container,
	item: ItemStack,
	slot: number,
	containerLocation?: DimensionLocation,
): void {
	const oldItem = container.getItem(slot);
	container.setItem(slot, item);
	if (oldItem !== undefined) {
		const overflow = container.addItem(oldItem);
		if (containerLocation !== undefined && overflow !== undefined) {
			containerLocation.dimension.spawnItem(overflow, containerLocation);
		}
	}
}

// Sets equipment slot and adds previous item to inventory.
// When entity is defined, the previous item can be spawned as an entity when their inventory is ful
export function setEquipmentSafe(
	equippable: EntityEquippableComponent,
	slot: EquipmentSlot,
	item: ItemStack,
	inventory?: EntityInventoryComponent,
	entity?: Entity,
): void {
	let oldEquipment: ItemStack | undefined = equippable.getEquipment(slot);
	equippable.setEquipment(slot, item);
	if (oldEquipment === undefined) {
		return;
	}
	if (inventory !== undefined) {
		// oldEquipment now holds item overflow or is undefined
		oldEquipment = inventory.container.addItem(oldEquipment);
	}
	if (oldEquipment !== undefined && entity !== undefined) {
		entity.dimension.spawnItem(oldEquipment, entity.location);
	}
}
