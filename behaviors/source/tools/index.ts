import "./helpers/index";

import { MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { GameManager } from "./game/gameManager";
import { ProjectileTracker } from "./game/tools/projectileTracker";
import { ItemManager } from "./world/itemManager";
import { KitManager } from "./world/kitManager";
import { StructureSchemaManager } from "./world/structureSchemaManager";
import { TickingAreaQueue } from "./world/tickingAreaQueue";

export interface MinigamesTools {
	readonly games: GameManager;
	readonly items: ItemManager;
	readonly kitManager: KitManager;
	readonly projectileTracker: ProjectileTracker;
	readonly structures: StructureSchemaManager;
	readonly tickingAreaQueue: TickingAreaQueue;
}

// biome-ignore lint/style/useExportsLast: Have to run init on some properties below declaration
export const tools: MinigamesTools = {
	games: new GameManager(),
	items: new ItemManager(),
	kitManager: new KitManager(),
	projectileTracker: new ProjectileTracker([MinecraftEntityTypes.ThrownTrident]),
	structures: new StructureSchemaManager(),
	tickingAreaQueue: new TickingAreaQueue(),
};

tools.items.init();
