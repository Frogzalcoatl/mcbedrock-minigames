import "./events/index";
import "./projectiles/iceBomb";
import { ProjectileTracker } from "./trackers/projectileTracker";

export interface MinigamesTools {
	readonly projectileTracker: ProjectileTracker;
}

export const minigames: MinigamesTools = {
	projectileTracker: new ProjectileTracker(),
};
