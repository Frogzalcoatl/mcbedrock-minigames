import {
	type Dimension,
	type Entity,
	EntityComponentTypes,
	type EntityInventoryComponent,
	type ItemStack,
	type Vector3,
} from "@minecraft/server";

const CONTAINER_TYPE_ID: string = "mg:container";

export function getDataValueItem(
	typeId: string,
	dataValue: number,
	originDimension: Dimension,
	originLocation: Vector3,
): ItemStack | null {
	if (!originDimension.isChunkLoaded(originLocation)) {
		return null;
	}
	const containerEntity: Entity = originDimension.spawnEntity(CONTAINER_TYPE_ID, originLocation);
	const inventory: EntityInventoryComponent | undefined = containerEntity.getComponent(
		EntityComponentTypes.Inventory,
	);
	if (inventory === undefined) {
		containerEntity.remove();
		return null;
	}
	containerEntity.runCommand(`/replaceitem entity @s slot.inventory 0 ${typeId} 1 ${dataValue}`);
	const dataValueItem: ItemStack | undefined = inventory.container.getItem(0);
	containerEntity.remove();
	if (dataValueItem === undefined) {
		return null;
	}
	return dataValueItem;
}
