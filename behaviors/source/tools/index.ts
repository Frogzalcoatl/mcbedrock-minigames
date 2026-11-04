import "./helpers/index";

import { MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { PACK_NAMESPACE } from "./constants";
import { GameManager } from "./game/gameManager";
import { ProjectileTracker } from "./game/tools/projectileTracker";
import { registerSimulatedPlayers } from "./simulatedPlayers";
import { registerStructureCommands } from "./structureSchemas/comands";
import { StructureSchemaManager } from "./structureSchemas/structureSchemaManager";
import { ItemManager } from "./world/itemManager";
import { KitManager } from "./world/kitManager";
import { TickingAreaQueue } from "./world/tickingAreaQueue";

export interface MinigamesTools {
	readonly games: GameManager;
	readonly items: ItemManager;
	readonly kitManager: KitManager;
	readonly projectileTracker: ProjectileTracker;
	readonly tickingAreaQueue: TickingAreaQueue;
}

// biome-ignore lint/style/useExportsLast: Have to run init on some properties below declaration
export const tools: MinigamesTools = {
	games: new GameManager(),
	items: new ItemManager(),
	kitManager: new KitManager(),
	projectileTracker: new ProjectileTracker([MinecraftEntityTypes.ThrownTrident]),
	tickingAreaQueue: new TickingAreaQueue(),
};

tools.items.init();

registerSimulatedPlayers({
	autoRespawn: true,
	namespace: PACK_NAMESPACE,
});

export const structureSchemaManager = new StructureSchemaManager(PACK_NAMESPACE);
registerStructureCommands(structureSchemaManager);
