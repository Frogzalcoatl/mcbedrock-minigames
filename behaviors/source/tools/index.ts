import "./misc/index";

import { KitManager } from "./game/kits";
import { ItemCooldownManager } from "./itemCooldownManager";
import { KillTracker, ProjectileTracker } from "./trackers";

export interface MinigamesTools {
	readonly itemCooldowns: ItemCooldownManager;
	readonly killTracker: KillTracker;
	readonly kitManager: KitManager;
	readonly projectileTracker: ProjectileTracker;
}

// biome-ignore lint/style/useExportsLast: Gotta init properties
export const tools: MinigamesTools = {
	itemCooldowns: new ItemCooldownManager(),
	killTracker: new KillTracker(140),
	kitManager: new KitManager(),
	projectileTracker: new ProjectileTracker(),
};

tools.itemCooldowns.init();
tools.killTracker.init(tools.kitManager);
tools.projectileTracker.init();
