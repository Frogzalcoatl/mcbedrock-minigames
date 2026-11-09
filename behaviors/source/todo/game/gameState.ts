/** biome-ignore-all lint/style/useNamingConvention: Using objects as an enums */
/** biome-ignore-all assist/source/useSortedKeys: Using objects as an enums */

export const GameState = {
	Resetting: 0,
	Open: 1,
	Full: 2,
	Active: 3,
	Ending: 4,
} as const;
export type GameState = (typeof GameState)[keyof typeof GameState];

export function gameStateToString(state: GameState): string {
	switch (state) {
		case GameState.Resetting:
			return "Resetting";
		case GameState.Open:
			return "Open";
		case GameState.Full:
			return "Full";
		case GameState.Active:
			return "Active";
		case GameState.Ending:
			return "Ending";
		default:
			return "Unknown";
	}
}
