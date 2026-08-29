import frogzalcoatlBridgeEnd from "./json/frogzalcoatl/bridge/end.json" with { type: "json" };
import frogzalcoatlDuelsMangrove from "./json/frogzalcoatl/duels/mangrove.json" with {
	type: "json",
};
import frogzalcoatlLobbyFrogland from "./json/frogzalcoatl/lobby/frogland.json" with {
	type: "json",
};
import frogzalcoatlLobbyHaroldsRealm from "./json/frogzalcoatl/lobby/haroldsRealm.json" with {
	type: "json",
};
import frogzalcoatlSkywarsExotic from "./json/frogzalcoatl/skywars/exotic.json" with {
	type: "json",
};
import frogzalcoatlSurvivalGamesOverworld from "./json/frogzalcoatl/survivalGames/overworld.json" with {
	type: "json",
};
import ghostlyKitPvp from "./json/ghostly/kitPvp.json" with { type: "json" };
import ghostlyShop from "./json/ghostly/shop.json" with { type: "json" };
import ghostlyShopNoChests from "./json/ghostly/shopNoChests.json";
import ghostlySpawn from "./json/ghostly/spawn.json" with { type: "json" };

// [structureId, relativeX, relativeY, relativeZ]
// structureId is the .mcstructure file path relative to behaviors/structures/mg/ (.mcstructure not included)
type JsonStructureEntry = [string, number, number, number];
export type StructureSchema = JsonStructureEntry[];

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

export function getStructureSchema(name: string): StructureSchema | null {
	const schema: unknown | undefined = structureSchemas.get(name);
	if (schema === undefined) {
		return null;
	} else {
		return schema as StructureSchema;
	}
}
