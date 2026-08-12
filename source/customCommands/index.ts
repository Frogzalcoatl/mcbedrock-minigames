import { system } from "@minecraft/server";
import { customCommandClearSim } from "./commands/clearSim";
import { customCommandExistingSave } from "./commands/existingsave";
import { customCommandHub } from "./commands/hub";
import { customCommandLoad } from "./commands/load";
import { customCommandNewSave } from "./commands/newsave";
import { customCommandProfile } from "./commands/profile";
import { customCommandQueue } from "./commands/queue";
import { customCommandSettings } from "./commands/settings";
import { customCommandSim } from "./commands/sim";
import { registerCommandEnums } from "./enums";

system.beforeEvents.startup.subscribe((e) => {
	registerCommandEnums(e.customCommandRegistry);
	e.customCommandRegistry.registerCommand(...customCommandSettings());
	e.customCommandRegistry.registerCommand(...customCommandLoad());
	e.customCommandRegistry.registerCommand(...customCommandHub());
	e.customCommandRegistry.registerCommand(...customCommandProfile());
	e.customCommandRegistry.registerCommand(...customCommandQueue());
	e.customCommandRegistry.registerCommand(...customCommandNewSave());
	e.customCommandRegistry.registerCommand(...customCommandExistingSave());
	e.customCommandRegistry.registerCommand(...customCommandSim());
	e.customCommandRegistry.registerCommand(...customCommandClearSim());
});
