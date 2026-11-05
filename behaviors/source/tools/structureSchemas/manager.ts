import { type Dimension, StructureAnimationMode, type Vector3, world } from "@minecraft/server";

const BLOCK_NORMAL = "frogzalcoatl:structure_block/normal";
const BLOCK_FLAT = "frogzalcoatl:structure_block/flat";

// [structureId, relativeX, relativeY, relativeZ]
// structureId is the .mcstructure file path relative to behaviors/structures/${PACK_NAMESPACE}/
// (.mcstructure file extension not included)
type JsonStructureEntry = [string, number, number, number];
export type StructureSchema = JsonStructureEntry[];

export class StructureSchemaManager {
	public readonly namespace: string;
	public readonly ids: Set<string>;
	private readonly _schemas: Map<string, StructureSchema>;

	public constructor(namespace: string) {
		this._schemas = new Map<string, StructureSchema>();
		this.ids = new Set<string>();
		this.namespace = namespace;
	}

	public addSchemas(schemas: [string, unknown][]): void {
		for (const s of schemas) {
			// unknown type is unavoidable when importing from json it seems
			// makes most sense to simply use type assertion here instead of with every import
			this._schemas.set(s[0], s[1] as StructureSchema);
			this.ids.add(s[0]);
		}
	}

	public addSchema(id: string, schema: StructureSchema): void {
		this._schemas.set(id, schema);
	}

	public addIds(...ids: string[]): void {
		for (const id of ids) {
			this.ids.add(id);
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
			world.structureManager.place(`${this.namespace}:${id}`, dimension, location, {
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
			world.structureManager.place(`${this.namespace}:${entry[0]}`, dimension, absLocation, {
				animationMode: animationMode,
				animationSeconds: animationSeconds,
			});
		}
	}

	public placeStructureBlocks(from: Vector3, to: Vector3, dimension: Dimension): void {
		const minX = Math.min(from.x, to.x);
		const maxX = Math.max(from.x, to.x);
		const minY = Math.min(from.y, to.y);
		const minZ = Math.min(from.z, to.z);
		const maxZ = Math.max(from.z, to.z);

		const isAtWorldMin: boolean = minY === dimension.heightRange.min;
		const structureBlockId = isAtWorldMin ? BLOCK_FLAT : BLOCK_NORMAL;
		const structureBlockY = isAtWorldMin ? dimension.heightRange.min : minY - 1;

		for (let x: number = minX - 1; x < maxX; x += 64) {
			for (let z: number = minZ - 1; z < maxZ; z += 64) {
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
			structureBlockId = BLOCK_FLAT;
			structureBlockY = dimension.heightRange.min;
		} else {
			structureBlockId = BLOCK_NORMAL;
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
