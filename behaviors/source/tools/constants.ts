// If you change the pack namespace, make sure to change the folder name at ${PROJECT_ROOT}/behaviors/structures/
export const PACK_NAMESPACE: string = "mg"; // MiniGames (mg)

// biome-ignore lint/nursery/useExplicitType: Using stisfies so ide still auto completes properties
export const gameIds = {
	duels: "duels",
	kitPvp: "kit",
	kitPvpHub: "hub-kit",
	mainHub: "hub",
} as const satisfies Record<string, string>;

export const MAX_EFFECT_DURATION: number = 2e7;
export const ICE_BOMB_ID: string = "minecraft:ice_bomb";
export const DEFAULT_CHATNAME_PREFIX = "§7";
