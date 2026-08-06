import {
	type Entity,
	EntityComponentTypes,
	type EntityInventoryComponent,
	type ItemStack,
} from "@minecraft/server";
import { giveItem } from "../items/utils/give";

export function giveItemToEntity(
	item: ItemStack,
	entity: Entity,
	spawnOverflowItems: boolean,
): void {
	if (!entity.isValid) {
		return;
	}
	const inventory: EntityInventoryComponent | undefined = entity.getComponent(
		EntityComponentTypes.Inventory,
	);
	if (inventory === undefined || !inventory.isValid) {
		return;
	}
	giveItem(item, inventory.container, entity.location, entity.dimension, spawnOverflowItems);
}
