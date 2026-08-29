import { type Dimension, StructureAnimationMode, type Vector3, world } from "@minecraft/server";
import { PACK_NAMESPACE } from "../constants";
import { getStructureSchema, type StructureSchema } from "./data";

export function loadStructure(
	structure: string,
	location: Vector3,
	dimension: Dimension,
	animationMode: StructureAnimationMode = StructureAnimationMode.None,
	animationSeconds: number = 0,
): void {
	const schema: StructureSchema | null = getStructureSchema(structure);
	if (schema === null) {
		world.structureManager.place(`${PACK_NAMESPACE}:${structure}`, dimension, location, {
			animationMode: animationMode,
			animationSeconds: animationSeconds,
		});
		return;
	}
	for (const entry of schema) {
		const absLocation: Vector3 = {
			x: location.x + entry[1],
			y: location.y + entry[2],
			z: location.z + entry[3],
		};
		world.structureManager.place(`${PACK_NAMESPACE}:${entry[0]}`, dimension, absLocation, {
			animationMode: animationMode,
			animationSeconds: animationSeconds,
		});
	}
}
