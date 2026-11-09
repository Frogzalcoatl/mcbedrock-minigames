import { type CustomCommandRegistry, system } from "@minecraft/server";
import { registerCommandEnums } from "./enums";
import { registerCommandHub } from "./hub";
import { registerCommandProfile } from "./profile";
import { registerCommandQ } from "./q";
import { registerCommandSettings } from "./settings";

system.beforeEvents.startup.subscribe((e) => {
	registerCommandEnums(e.customCommandRegistry);
	const commandRegistryFuncs: ((r: CustomCommandRegistry) => void)[] = [
		registerCommandHub,
		registerCommandProfile,
		registerCommandQ,
		registerCommandSettings,
	];
	for (const func of commandRegistryFuncs) {
		func(e.customCommandRegistry);
	}
});
