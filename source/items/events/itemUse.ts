import { type ItemUseAfterEvent, world } from "@minecraft/server";

export interface ItemUseEntry {
	typeId: string;
	callback: (event: ItemUseAfterEvent) => void;
}

export const itemUseMap = new Map<string, ItemUseEntry>(); // [nameTag, entry]

export function itemUseHandler(event: ItemUseAfterEvent): void {
	if (event.itemStack.nameTag === undefined) {
		return;
	}
	const entry: ItemUseEntry | undefined = itemUseMap.get(event.itemStack.nameTag);
	if (entry !== undefined && entry.typeId === event.itemStack.typeId) {
		entry.callback(event);
	}
}

world.afterEvents.itemUse.subscribe(itemUseHandler);
