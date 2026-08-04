import type { Container, ItemStack } from "@minecraft/server";

// Properly stacks items to matching itemstack instances in container if applicable
export function giveItem(container: Container, item: ItemStack): void {
	if (!container.isValid) {
		return;
	}
	const existingIndex: number | undefined = container.find(item);
	if (!existingIndex) {
		container.addItem(item);
		return;
	}
	const existingItem: ItemStack | undefined = container.getItem(existingIndex);
	if (existingItem === undefined) {
		container.addItem(item);
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
		container.addItem(existingItem);
	}
}
