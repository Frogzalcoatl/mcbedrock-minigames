import { type DimensionLocation, type Vector3, world } from "@minecraft/server";
import { getOurStructures, type OurStructure } from "./data";

export function loadOurStructure(structure: string, location: DimensionLocation): boolean {
	const structures: OurStructure[] = getOurStructures(structure);
	if (structures.length === 0) {
		return false;
	}
	let successCount: number = 0;
	for (const s of structures) {
		const absLocation: Vector3 = {
			x: s.relLocation.x + location.x,
			y: s.relLocation.y + location.y,
			z: s.relLocation.z + location.z,
		};
		world.structureManager.place(s.id, location.dimension, absLocation);
		successCount++;
	}
	if (successCount === 0) {
		return false;
	}
	return true;
}
