import { type Dimension, type Vector3, world } from "@minecraft/server";
import { PACK_NAMESPACE } from "../constants";
import { getStructureSchema, type StructureSchema } from "./data";

const structureBlockNormal: string = `${PACK_NAMESPACE}:frogzalcoatl/structureBlock/normal`;
const structureBlockFlat: string = `${PACK_NAMESPACE}:frogzalcoatl/structureBlock/flat`;

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
	if (from.y === dimension.heightRange.min) {
		structureBlockId = structureBlockFlat;
		structureBlockY = dimension.heightRange.min;
	} else {
		structureBlockId = structureBlockNormal;
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
	const schema: StructureSchema = getStructureSchema(structureId);
	let structureBlockY: number = 0;
	let structureBlockId: string = "";
	if (at.y < dimension.heightRange.min || at.y > dimension.heightRange.max) {
		return;
	} else if (at.y === dimension.heightRange.min) {
		structureBlockId = structureBlockFlat;
		structureBlockY = dimension.heightRange.min;
	} else {
		structureBlockId = structureBlockNormal;
		structureBlockY = at.y - 1;
	}
	for (const entry of schema) {
		const location: Vector3 = {
			x: at.x + entry[1] - 1,
			y: structureBlockY + entry[2],
			z: at.z + entry[3] - 1,
		};
		world.structureManager.place(structureBlockId, dimension, location);
	}
}
