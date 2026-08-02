import {
	type DimensionLocation,
	StructureAnimationMode,
	type Vector3,
	world,
} from "@minecraft/server";
import { getOurStructures, type OurStructure } from "./data";

export function loadOurStructure(
	structure: string,
	location: DimensionLocation,
	animationMode: StructureAnimationMode = StructureAnimationMode.None,
	animationSeconds: number = 0,
): boolean {
	const structures: OurStructure[] | null = getOurStructures(structure);
	if (structures === null) {
		return false;
	}
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
	return true;
}
