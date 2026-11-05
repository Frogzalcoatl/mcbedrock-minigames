/** biome-ignore-all assist/source/useSortedKeys: Maintain order for enum */
/** biome-ignore-all lint/style/useExportsLast: isRegistered makes more sense above the exported function */
import { type CustomCommandRegistry, GameMode } from "@minecraft/server";

const commandGameModes: Record<string, GameMode> = {
	"0": GameMode.Survival,
	s: GameMode.Survival,
	survival: GameMode.Survival,
	"1": GameMode.Creative,
	c: GameMode.Creative,
	creative: GameMode.Creative,
	"2": GameMode.Adventure,
	a: GameMode.Adventure,
	adventure: GameMode.Adventure,
	spectator: GameMode.Spectator,
};

export function parseCommandGameMode(str: string): GameMode | undefined {
	return commandGameModes[str.toLocaleLowerCase()];
}

let isRegistered = false;

// Returns enum name
export function registerCommandGameModeEnum(
	namespace: string,
	registry: CustomCommandRegistry,
): string {
	if (isRegistered) {
		return `${namespace}:gameMode`;
	}
	const enumName: string = `${namespace}:gameMode`;
	registry.registerEnum(enumName, Object.keys(commandGameModes));
	isRegistered = true;
	return enumName;
}
