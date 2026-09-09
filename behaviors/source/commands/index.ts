import { type CustomCommandRegistry, system } from "@minecraft/server";
import { registerCommandClearSim } from "./clearsim";
import { registerCommandExistingSave } from "./existingsave";
import { registerCommandHub } from "./hub";
import { registerCommandLoad } from "./load";
import { registerCommandNewSave } from "./newsave";
import { registerCommandProfile } from "./profile";
import { registerCommandQ } from "./q";
import { registerCommandSettings } from "./settings";
import { registerCommandSim } from "./sim";
import { registerCommandEnums } from "./utils/enums";

system.beforeEvents.startup.subscribe((e) => {
	registerCommandEnums(e.customCommandRegistry);
	const commandRegistryFuncs: ((r: CustomCommandRegistry) => void)[] = [
		registerCommandClearSim,
		registerCommandExistingSave,
		registerCommandHub,
		registerCommandLoad,
		registerCommandNewSave,
		registerCommandProfile,
		registerCommandQ,
		registerCommandSettings,
		registerCommandSim,
	];
	for (const func of commandRegistryFuncs) {
		func(e.customCommandRegistry);
	}
});
