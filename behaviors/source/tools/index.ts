import { ItemCooldownManager } from "./itemCooldownManager";
import "./events/index";
import "./projectiles/iceBomb";
import { KillTracker } from "./trackers/killTracker";
import { ProjectileTracker } from "./trackers/projectileTracker";

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
