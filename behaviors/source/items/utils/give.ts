import type { Container, Dimension, ItemStack, Vector3 } from "@minecraft/server";

function addItem(
	item: ItemStack,
	container: Container,
	containerLocation: Vector3,
	containerDimension: Dimension,
	spawnOverflowItems: boolean,
): void {
	const leftoverItem: ItemStack | undefined = container.addItem(item);
	if (
		spawnOverflowItems &&
		leftoverItem !== undefined &&
		containerDimension.isChunkLoaded(containerLocation)
	) {
		containerDimension.spawnItem(leftoverItem, {
			x: containerLocation.x,
			y: containerLocation.y,
			z: containerLocation.z,
		});
	}
}

// Properly stacks items to matching itemstack instances in container if applicable

// Regular container.addItem does not properly stack matching items in some specific cases
// ^^ e.g. two items both have itemLock set to inventory but are not stacked when container.addItem is run

// spawnOverflowItems: When true, spawns item as entity if container is full
export function giveItem(
	item: ItemStack,
	container: Container,
	containerLocation: Vector3,
	containerDimension: Dimension,
	spawnOverflowItems: boolean,
): void {
	const existingIndex: number | undefined = container.find(item);
	if (!existingIndex) {
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
