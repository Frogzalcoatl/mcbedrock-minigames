import type { Container, Dimension, ItemStack, Vector3 } from "@minecraft/server";

// spawnOverflowItems: When true, spawns item as entity if container is full
export function giveItem(
	item: ItemStack,
	container: Container,
	location: Vector3,
	dimension: Dimension,
	spawnOverflowItems: boolean,
): void {
	const overflow: ItemStack | undefined = container.addItem(item);
	if (spawnOverflowItems && overflow !== undefined && dimension.isChunkLoaded(location)) {
		// Avoids LocationOutOfWorldBoundariesError
		const spawnLocation: Vector3 = {
			x: location.x,
			y: dimension.heightRange.min,
			z: location.z,
		};
		dimension.spawnItem(overflow, spawnLocation).teleport(location);
	}
}
