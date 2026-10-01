import "./misc/index";

import { ItemCooldownManager } from "./itemCooldownManager";
import { KitManager } from "./kits";
import { TickingAreaQueue } from "./tickingAreaQueue";
import { KillTracker, ProjectileTracker } from "./trackers";

export interface MinigamesTools {
	readonly itemCooldowns: ItemCooldownManager;
	readonly killTracker: KillTracker;
	readonly kitManager: KitManager;
	readonly projectileTracker: ProjectileTracker;
	readonly tickingAreaQueue: TickingAreaQueue;
}

// biome-ignore lint/style/useExportsLast: Gotta init properties
export const tools: MinigamesTools = {
	itemCooldowns: new ItemCooldownManager(),
	killTracker: new KillTracker(140),
	kitManager: new KitManager(),
	projectileTracker: new ProjectileTracker(),
	tickingAreaQueue: new TickingAreaQueue(),
};

tools.itemCooldowns.init();
tools.killTracker.init(tools.kitManager);
tools.projectileTracker.init();
