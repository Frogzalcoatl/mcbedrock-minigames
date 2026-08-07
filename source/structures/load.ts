import { type Dimension, StructureAnimationMode, type Vector3, world } from "@minecraft/server";
import { getStructureInfo, type StructureInfo } from "./data";

export function loadStructure(
	structure: string,
	location: Vector3,
	dimension: Dimension,
	animationMode: StructureAnimationMode = StructureAnimationMode.None,
	animationSeconds: number = 0,
): void {
	const structures: StructureInfo[] = getStructureInfo(structure);
	for (const s of structures) {
		const absLocation: Vector3 = {
			x: location.x + s.relLocation.x,
			y: location.y + s.relLocation.y,
			z: location.z + s.relLocation.z,
		};
		world.structureManager.place(s.id, dimension, absLocation, {
			animationMode: animationMode,
			animationSeconds: animationSeconds,
		});
	}
}
