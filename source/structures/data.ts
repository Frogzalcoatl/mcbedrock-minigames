import type { Vector3 } from "@minecraft/server";
import { PACK_NAMESPACE } from "../constants";
import rawFrogzalcoatlBridgeEnd from "./json/frogzalcoatl/bridge/end.json";
import rawFrogzalcoatlDuelsMangrove from "./json/frogzalcoatl/duels/mangrove.json";
import rawFrogzalcoatlLobbyFrogland from "./json/frogzalcoatl/lobby/frogland.json";
import rawFrogzalcoatlLobbyHaroldsRealm from "./json/frogzalcoatl/lobby/haroldsRealm.json";
import rawFrogzalcoatlSkywarsExotic from "./json/frogzalcoatl/skywars/exotic.json";
import rawFrogzalcoatlSurvivalGamesOverworld from "./json/frogzalcoatl/survivalGames/overworld.json";
import rawGhostlyKitPvp from "./json/ghostly/kitPvp.json" with { type: "json" };
import rawGhostlyShop from "./json/ghostly/shop.json" with { type: "json" };
import rawGhostlyShopNoChests from "./json/ghostly/shopNoChests.json";
import rawGhostlySpawn from "./json/ghostly/spawn.json" with { type: "json" };

type JsonStructureEntry = [string, number, number, number]; // [structureId, relativeX, relativeY, relativeZ]
type StructureSchema = JsonStructureEntry[];

const ghostlySpawn = rawGhostlySpawn as unknown as StructureSchema;
const ghostlyShop = rawGhostlyShop as unknown as StructureSchema;
const ghostlyShopNoChests = rawGhostlyShopNoChests as unknown as StructureSchema;
const ghostlyKitPvp = rawGhostlyKitPvp as unknown as StructureSchema;
const frogzalcoatlDuelsMangrove = rawFrogzalcoatlDuelsMangrove as unknown as StructureSchema;
const frogzalcoatlSkywarsExotic = rawFrogzalcoatlSkywarsExotic as unknown as StructureSchema;
const frogzalcoatlBridgeEnd = rawFrogzalcoatlBridgeEnd as unknown as StructureSchema;
const frogzalcoatlLobbyFrogland = rawFrogzalcoatlLobbyFrogland as unknown as StructureSchema;
const frogzalcoatlSurvivalGamesOverworld =
	rawFrogzalcoatlSurvivalGamesOverworld as unknown as StructureSchema;
const frogzalcoatlLobbyHaroldsRealm =
	rawFrogzalcoatlLobbyHaroldsRealm as unknown as StructureSchema;

export type StructureInfo = {
	id: string;
	relLocation: Vector3;
};

const structureSchemas = new Map<string, StructureSchema>([
	["ghostly/spawn", ghostlySpawn],
	["ghostly/shop", ghostlyShop],
	["ghostly/shopNoChests", ghostlyShopNoChests],
	["ghostly/kitPvp", ghostlyKitPvp],
	["frogzalcoatl/duels/mangrove", frogzalcoatlDuelsMangrove],
	["frogzalcoatl/skywars/exotic", frogzalcoatlSkywarsExotic],
	["frogzalcoatl/bridge/end", frogzalcoatlBridgeEnd],
	["frogzalcoatl/lobby/frogland", frogzalcoatlLobbyFrogland],
	["frogzalcoatl/survivalGames/overworld", frogzalcoatlSurvivalGamesOverworld],
	["frogzalcoatl/lobby/haroldsRealm", frogzalcoatlLobbyHaroldsRealm],
]);

export const structureIds: string[] = [
	"ghostly/crates",
	"ghostly/tree",
	"ghostly/mountain",
	"frogzalcoatl/duels/mooshroom",
	"frogzalcoatl/duels/sumo",
	"frogzalcoatl/skywars/waitingArea",
	"frogzalcoatl/lobby/minersRealm",
	"frogzalcoatl/bedwars/chambers/base",
	"frogzalcoatl/bedwars/chambers/diamonds",
	"frogzalcoatl/bedwars/chambers/mid",
	"frogzalcoatl/bedwars/desert/base",
	"frogzalcoatl/bedwars/desert/diamonds",
	"frogzalcoatl/bedwars/desert/mid",
	"frogzalcoatl/bedwars/desert/extra",
	"frogzalcoatl/bedwars/netherlands/base",
	"frogzalcoatl/bedwars/netherlands/diamonds1",
	"frogzalcoatl/bedwars/netherlands/diamonds2",
	"frogzalcoatl/bedwars/netherlands/mid",
	"frogzalcoatl/bedwars/template/base",
	"frogzalcoatl/bedwars/template/diamonds",
	"frogzalcoatl/bedwars/template/mid",
];
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
