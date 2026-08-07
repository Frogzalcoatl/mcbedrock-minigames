import { type Dimension, type Vector3, world } from "@minecraft/server";
import { STRUCTURE_NAMESPACE } from "../constants";

export function placeStructureBlocks(from: Vector3, to: Vector3, dimension: Dimension): void {
	if (from.x > to.x) {
		[from.x, to.x] = [to.x, from.x];
	}
	if (from.y > to.y) {
		[from.y, to.y] = [to.y, from.y];
	}
	if (from.z > to.z) {
		[from.z, to.z] = [to.z, from.z];
	}
	let structureBlockY: number = 0;
	let structureBlockId: string = "";
	if (from.y < dimension.heightRange.min || to.y > dimension.heightRange.max) {
		return;
	} else if (from.y === dimension.heightRange.min) {
		structureBlockId = `${STRUCTURE_NAMESPACE}:structureBlockFlat`;
		structureBlockY = dimension.heightRange.min;
	} else {
		structureBlockId = `${STRUCTURE_NAMESPACE}:structureBlock`;
		structureBlockY = from.y - 1;
	}
	for (let x: number = from.x - 1; x <= to.x - 1; x += 64) {
		for (let z: number = from.z - 1; z <= to.z - 1; z += 64) {
			const location: Vector3 = {
				x: x,
				y: structureBlockY,
				z: z,
			};
			world.structureManager.place(structureBlockId, dimension, location);
		}
	}
}
