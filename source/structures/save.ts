import { type Dimension, type Vector3, world } from "@minecraft/server";
import { STRUCTURE_NAMESPACE } from "../constants";
import { getStructureInfo, type StructureInfo } from "./data";

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
	for (let x: number = from.x - 1; x < to.x; x += 64) {
		for (let z: number = from.z - 1; z < to.z; z += 64) {
			const location: Vector3 = {
				x: x,
				y: structureBlockY,
				z: z,
			};
			world.structureManager.place(structureBlockId, dimension, location);
		}
	}
}

export function placeStructureBlocksFor(
	structureId: string,
	at: Vector3,
	dimension: Dimension,
): void {
	const info: StructureInfo[] = getStructureInfo(structureId);
	let structureBlockY: number = 0;
	let structureBlockId: string = "";
	if (at.y < dimension.heightRange.min || at.y > dimension.heightRange.max) {
		return;
	} else if (at.y === dimension.heightRange.min) {
		structureBlockId = `${STRUCTURE_NAMESPACE}:structureBlockFlat`;
		structureBlockY = dimension.heightRange.min;
	} else {
		structureBlockId = `${STRUCTURE_NAMESPACE}:structureBlock`;
		structureBlockY = at.y - 1;
	}
	for (const i of info) {
		const location: Vector3 = {
			x: at.x + i.relLocation.x - 1,
			y: structureBlockY + i.relLocation.y,
			z: at.z + i.relLocation.z - 1,
		};
		world.structureManager.place(structureBlockId, dimension, location);
	}
}
