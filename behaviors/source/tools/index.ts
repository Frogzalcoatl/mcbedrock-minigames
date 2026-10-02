import "./misc/index";

import { ItemManager } from "./itemManager";
import { KitManager } from "./kits";
import { TickingAreaQueue } from "./tickingAreaQueue";
import { KillTracker, ProjectileTracker } from "./trackers";

export interface MinigamesTools {
	readonly items: ItemManager;
	readonly killTracker: KillTracker;
	readonly kitManager: KitManager;
	readonly projectileTracker: ProjectileTracker;
	readonly tickingAreaQueue: TickingAreaQueue;
}

// biome-ignore lint/style/useExportsLast: Gotta init properties
export const tools: MinigamesTools = {
	items: new ItemManager(),
	killTracker: new KillTracker(140),
	kitManager: new KitManager(),
	projectileTracker: new ProjectileTracker(),
	tickingAreaQueue: new TickingAreaQueue(),
};

tools.items.init();
tools.killTracker.init(tools.kitManager);
tools.projectileTracker.init();
