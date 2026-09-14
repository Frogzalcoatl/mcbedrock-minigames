/** biome-ignore-all lint/style/useNamingConvention: Using object as an enum */
/** biome-ignore-all assist/source/useSortedKeys: Using object as an enum */

export const GameState = {
	Preparing: 0,
	Starting: 1,
	Active: 2,
} as const;
export type GameState = (typeof GameState)[keyof typeof GameState];
