import { type ItemUseAfterEvent, world } from "@minecraft/server";

export interface ItemUseValue {
	typeId: string;
	callback: (event: ItemUseAfterEvent) => void;
}

export const itemUseMap = new Map<string, ItemUseValue>(); // [nameTag, value]

export function itemUseHandler(event: ItemUseAfterEvent): void {
	if (event.itemStack.nameTag === undefined) {
		return;
	}
	const value: ItemUseValue | undefined = itemUseMap.get(event.itemStack.nameTag);
	if (value !== undefined && value.typeId === event.itemStack.typeId) {
		value.callback(event);
	}
}

world.afterEvents.itemUse.subscribe(itemUseHandler);
