import type { Vector3 } from "@minecraft/server";
import { PACK_NAMESPACE } from "../constants";
import frogzalcoatlBridgeEnd from "./json/frogzalcoatl/bridge/end.json";
import frogzalcoatlDuelsMangrove from "./json/frogzalcoatl/duels/mangrove.json";
import frogzalcoatlLobbyFrogland from "./json/frogzalcoatl/lobby/frogland.json";
import frogzalcoatlLobbyHaroldsRealm from "./json/frogzalcoatl/lobby/haroldsRealm.json";
import frogzalcoatlSkywarsExotic from "./json/frogzalcoatl/skywars/exotic.json";
import frogzalcoatlSurvivalGamesOverworld from "./json/frogzalcoatl/survivalGames/overworld.json";
import ghostlyKitPvp from "./json/ghostly/kitPvp.json" with { type: "json" };
import ghostlyShop from "./json/ghostly/shop.json" with { type: "json" };
import ghostlyShopNoChests from "./json/ghostly/shopNoChests.json";
import ghostlySpawn from "./json/ghostly/spawn.json" with { type: "json" };

type JsonStructureEntry = [string, number, number, number]; // [structureId, relativeX, relativeY, relativeZ]
type StructureSchema = JsonStructureEntry[];

export type StructureInfo = {
	id: string;
	relLocation: Vector3;
};

const structureSchemas = new Map<string, unknown>([
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
	const schema: unknown | undefined = structureSchemas.get(name);
	if (schema === undefined) {
		return [{ id: `${PACK_NAMESPACE}:${name}`, relLocation: { x: 0, y: 0, z: 0 } }];
	} else {
		return schemaToStructureInfo(schema as StructureSchema);
	}
}
