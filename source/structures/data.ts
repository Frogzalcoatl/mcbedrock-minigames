import type { Vector3 } from "@minecraft/server";
import { PACK_NAMESPACE } from "../constants";
import rawGhostlyMangrove from "./json/ghostlyMangrove.json" with { type: "json" };
import rawGhostlyMangroveNoChests from "./json/ghostlyMangroveNoChests.json";
import rawGhostlySpawn from "./json/ghostlySpawn.json" with { type: "json" };
import rawKitPvpArena from "./json/kitPvpArena.json" with { type: "json" };

type JsonStructureEntry = [string, number, number, number]; // [structureId, relativeX, relativeY, relativeZ]
type StructureSchema = JsonStructureEntry[];

const ghostlySpawn = rawGhostlySpawn as unknown as StructureSchema;
const ghostlyMangrove = rawGhostlyMangrove as unknown as StructureSchema;
const ghostlyMangroveNoChests = rawGhostlyMangroveNoChests as unknown as StructureSchema;
const kitPvpArena = rawKitPvpArena as unknown as StructureSchema;

export type StructureInfo = {
	id: string;
	relLocation: Vector3;
};

const structureSchemas = new Map<string, StructureSchema>([
	["ghostlySpawn", ghostlySpawn],
	["ghostlyMangrove", ghostlyMangrove],
	["ghostlyMangroveNoChests", ghostlyMangroveNoChests],
	["kitPvpArena", kitPvpArena],
]);

export const structureIds: string[] = ["ghostlyCrates", "ghostlyTree", "ghostlyMountain"];
structureIds.push(...structureSchemas.keys());

function schemaToStructureInfo(schema: StructureSchema): StructureInfo[] {
	const arr: StructureInfo[] = [];
	for (const entry of schema) {
		arr.push({
			id: `${PACK_NAMESPACE}:${entry[0]}`,
			relLocation: { x: entry[1], y: entry[2], z: entry[3] },
		});
	}
	return arr;
}

export function getStructureInfo(name: string): StructureInfo[] {
	const schema: StructureSchema | undefined = structureSchemas.get(name);
	if (schema === undefined) {
		return [{ id: `${PACK_NAMESPACE}:${name}`, relLocation: { x: 0, y: 0, z: 0 } }];
	} else {
		return schemaToStructureInfo(schema);
	}
}
