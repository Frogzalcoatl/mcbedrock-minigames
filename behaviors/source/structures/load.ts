import { type Dimension, StructureAnimationMode, type Vector3, world } from "@minecraft/server";
import { getStructureSchema, type StructureSchema } from "./data";

export function loadStructure(
	structure: string,
	location: Vector3,
	dimension: Dimension,
	animationMode: StructureAnimationMode = StructureAnimationMode.None,
	animationSeconds: number = 0,
): void {
	const schema: StructureSchema = getStructureSchema(structure);
	for (const s of schema) {
		const absLocation: Vector3 = {
			x: location.x + s[1],
			y: location.y + s[2],
			z: location.z + s[3],
		};
		world.structureManager.place(s[0], dimension, absLocation, {
			animationMode: animationMode,
			animationSeconds: animationSeconds,
		});
	}
}
