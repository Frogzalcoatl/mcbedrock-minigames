import type { Container, ItemStack } from "@minecraft/server";

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
