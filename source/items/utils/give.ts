import type { Container, Dimension, ItemStack, Vector3 } from "@minecraft/server";

// spawnOverflowItem = true: Spawn item as entity if container is full
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

// Properly stacks items to matching itemstack instances in container if applicable
export function giveItem(
	item: ItemStack,
	container: Container,
	containerLocation: Vector3,
	containerDimension: Dimension,
	spawnOverflowItems: boolean = true,
): void {
	if (!container.isValid) {
		return;
	}
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
