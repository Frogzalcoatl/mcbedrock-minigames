import { ItemStack } from "@minecraft/server";

// was typing this everywhere so just created a func for it.
export function defaultItemStackFunc(typeId: string, nameTag: string): ItemStack {
	const item = new ItemStack(typeId);
	item.nameTag = nameTag;
	return item;
}
