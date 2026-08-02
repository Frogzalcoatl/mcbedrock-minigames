import type { Vector3 } from "@minecraft/server";
import { STRUCTURE_NAMESPACE } from "../constants";
import rawGhostlyMangrove from "./json/ghostlyMangrove.json" with { type: "json" };
import rawGhostlySpawn from "./json/ghostlySpawn.json" with { type: "json" };
import rawKitPvpArena from "./json/kitPvpArena.json" with { type: "json" };

type JsonStructureEntry = [string, number, number, number];
type StructureSchema = JsonStructureEntry[];

const ghostlySpawn = rawGhostlySpawn as unknown as StructureSchema;
const ghostlyMangrove = rawGhostlyMangrove as unknown as StructureSchema;
const kitPvpArena = rawKitPvpArena as unknown as StructureSchema;

export type OurStructure = {
	id: string;
	relLocation: Vector3;
};

export const ourStructureIds: string[] = [
	"ghostlyCrate",
	"ghostlyMangrove",
	"ghostlySpawn",
	"kitPvpArena",
];

export function isOurStructureId(val: string): boolean {
	return ourStructureIds.includes(val);
}

function schemaToStructures(schema: StructureSchema): OurStructure[] {
	const arr: OurStructure[] = [];
	for (let i: number = 0; i < schema.length; i++) {
		const entry: JsonStructureEntry | undefined = schema[i];
		if (entry === undefined) {
			continue;
		}
		arr.push({
			id: `${STRUCTURE_NAMESPACE}:${entry[0]}`,
			relLocation: { x: entry[1], y: entry[2], z: entry[3] },
		});
	}
	return arr;
}

function getDefaultStructureArr(id: string): OurStructure[] {
	return [{ id: id, relLocation: { x: 0, y: 0, z: 0 } }];
}

export function getOurStructures(name: string): OurStructure[] | null {
	switch (name) {
		case "ghostlySpawn":
			return schemaToStructures(ghostlySpawn);
		case "ghostlyMangrove":
			return schemaToStructures(ghostlyMangrove);
		case "ghostlyCrate":
			return getDefaultStructureArr("ghostlyCrate");
		case "kitPvpArena":
			return schemaToStructures(kitPvpArena);
		default:
			return null;
	}
}
