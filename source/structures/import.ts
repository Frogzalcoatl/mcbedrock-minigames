import {
	type DimensionLocation,
	StructureAnimationMode,
	type Vector3,
	world,
} from "@minecraft/server";
import { getStructureInfoArr, type StructureInfo } from "./data";

export function importStructure(
	structure: string,
	location: DimensionLocation,
	animationMode: StructureAnimationMode = StructureAnimationMode.None,
	animationSeconds: number = 0,
): void {
	const structures: StructureInfo[] = getStructureInfoArr(structure);
	for (const s of structures) {
		const absLocation: Vector3 = {
			x: s.relLocation.x + location.x,
			y: s.relLocation.y + location.y,
			z: s.relLocation.z + location.z,
		};
		world.structureManager.place(s.id, location.dimension, absLocation, {
			animationMode: animationMode,
			animationSeconds: animationSeconds,
		});
	}
}
