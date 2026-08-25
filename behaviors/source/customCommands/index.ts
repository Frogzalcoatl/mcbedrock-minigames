import { type CustomCommandRegistry, system } from "@minecraft/server";
import { registerCommandClearSim } from "./commands/clearsim";
import { registerCommandExistingSave } from "./commands/existingsave";
import { registerCommandHub } from "./commands/hub";
import { registerCommandLoad } from "./commands/load";
import { registerCommandNewSave } from "./commands/newsave";
import { registerCommandProfile } from "./commands/profile";
import { registerCommandQ } from "./commands/q";
import { registerCommandSettings } from "./commands/settings";
import { registerCommandSim } from "./commands/sim";
import { registerCommandEnums } from "./enums";

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

system.beforeEvents.startup.subscribe((e) => {
	registerCommandEnums(e.customCommandRegistry);
	for (const func of commandRegistryFuncs) {
		func(e.customCommandRegistry);
	}
});
