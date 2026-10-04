import "./events";
import "./projectiles/index";

import { ItemManager } from "./managers/itemManager";
import { KitManager } from "./managers/kits";
import { StructureSchemaManager } from "./managers/structureSchemaManager";
import { TickingAreaQueue } from "./managers/tickingAreaQueue";
import { KillTracker, ProjectileTracker } from "./managers/trackers";

export interface MinigamesTools {
	readonly items: ItemManager;
	readonly killTracker: KillTracker;
	readonly kitManager: KitManager;
	readonly projectileTracker: ProjectileTracker;
	readonly structures: StructureSchemaManager;
	readonly tickingAreaQueue: TickingAreaQueue;
}

// biome-ignore lint/style/useExportsLast: Have to run init on some properties below declaration
export const tools: MinigamesTools = {
	items: new ItemManager(),
	killTracker: new KillTracker(140),
	kitManager: new KitManager(),
	projectileTracker: new ProjectileTracker(),
	structures: new StructureSchemaManager(),
	tickingAreaQueue: new TickingAreaQueue(),
};

tools.items.init();
tools.killTracker.init(tools.kitManager);
tools.projectileTracker.init();
