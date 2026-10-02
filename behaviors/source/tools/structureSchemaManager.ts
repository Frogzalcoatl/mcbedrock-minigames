import { type Dimension, StructureAnimationMode, type Vector3, world } from "@minecraft/server";
import { PACK_NAMESPACE } from "./constants";

const structureBlockNormal: string = `${PACK_NAMESPACE}:frogzalcoatl/structureBlock/normal`;
const structureBlockFlat: string = `${PACK_NAMESPACE}:frogzalcoatl/structureBlock/flat`;

// [structureId, relativeX, relativeY, relativeZ]
// structureId is the .mcstructure file path relative to behaviors/structures/${PACK_NAMESPACE}/ (.mcstructure not included)
type JsonStructureEntry = [string, number, number, number];
export type StructureSchema = JsonStructureEntry[];

export class StructureSchemaManager {
	private readonly _schemas: Map<string, StructureSchema>;
	public readonly ids: string[];

	public constructor() {
		this._schemas = new Map<string, StructureSchema>();
		this.ids = [];
	}

	public addSchemas(schemas: [string, unknown][]): void {
		for (const s of schemas) {
			// Im still not sure how to avoid type assertion when importing json schemas in ts
			this._schemas.set(s[0], s[1] as StructureSchema);
			if (!this.ids.includes(s[0])) {
				this.ids.push(s[0]);
			}
		}
	}

	public addIds(ids: string[]): void {
		for (const id of ids) {
			if (!this.ids.includes(id)) {
				this.ids.push(id);
			}
		}
	}

	public load(
		id: string,
		location: Vector3,
		dimension: Dimension,
		animationMode: StructureAnimationMode = StructureAnimationMode.None,
		animationSeconds = 0,
	): void {
		const schema: StructureSchema | undefined = this._schemas.get(id);
		if (schema === undefined) {
			world.structureManager.place(`${PACK_NAMESPACE}:${id}`, dimension, location, {
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

	public placeStructureBlocks(from: Vector3, to: Vector3, dimension: Dimension): void {
		let temp = 0;
		if (from.x > to.x) {
			temp = from.x;
			from.x = to.x;
			to.x = temp;
		}
		if (from.y > to.y) {
			temp = from.y;
			from.y = to.y;
			to.y = temp;
		}
		if (from.z > to.z) {
			temp = from.z;
			from.z = to.z;
			to.z = temp;
		}
		let structureBlockY = 0;
		let structureBlockId = "";
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

	public placeStructureBlocksFor(id: string, at: Vector3, dimension: Dimension): void {
		let structureBlockY = 0;
		let structureBlockId = "";
		if (at.y < dimension.heightRange.min || at.y > dimension.heightRange.max) {
			return;
		} else if (at.y === dimension.heightRange.min) {
			structureBlockId = structureBlockFlat;
			structureBlockY = dimension.heightRange.min;
		} else {
			structureBlockId = structureBlockNormal;
			structureBlockY = at.y - 1;
		}
		const schema: StructureSchema | undefined = this._schemas.get(id);
		if (schema === undefined) {
			world.structureManager.place(structureBlockId, dimension, {
				x: at.x - 1,
				y: structureBlockY,
				z: at.z - 1,
			});
			return;
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
}
