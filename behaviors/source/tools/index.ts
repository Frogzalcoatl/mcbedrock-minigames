import "./misc/projectiles/iceBomb";

import { ItemCooldownManager } from "./itemCooldownManager";
import { KillTracker, ProjectileTracker } from "./trackers";

export interface MinigamesTools {
	readonly itemCooldowns: ItemCooldownManager;
	readonly killTracker: KillTracker;
	readonly projectileTracker: ProjectileTracker;
}

// biome-ignore lint/style/useExportsLast: Gotta init properties
export const tools: MinigamesTools = {
	itemCooldowns: new ItemCooldownManager(),
	killTracker: new KillTracker(140),
	projectileTracker: new ProjectileTracker(),
};

tools.itemCooldowns.init();
tools.killTracker.init();
tools.projectileTracker.init();
