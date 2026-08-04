import type { ItemStack } from "@minecraft/server";

export function itemNameMatches(item: ItemStack, typeId: string, nameTag: string): boolean {
	return typeId === item.typeId && nameTag === item.nameTag;
}
