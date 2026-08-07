import { system } from "@minecraft/server";
import { customCommandHub } from "./commands/hub";
import { customCommandLoad } from "./commands/load";
import { customCommandProfile } from "./commands/player";
import { customCommandQueue } from "./commands/queue";
import { customCommandRooms } from "./commands/rooms";
import { customCommandSave } from "./commands/save";
import { registerCommandEnums } from "./enums";

system.beforeEvents.startup.subscribe((e) => {
	registerCommandEnums(e.customCommandRegistry);
	e.customCommandRegistry.registerCommand(...customCommandRooms());
	e.customCommandRegistry.registerCommand(...customCommandLoad());
	e.customCommandRegistry.registerCommand(...customCommandHub());
	e.customCommandRegistry.registerCommand(...customCommandProfile());
	e.customCommandRegistry.registerCommand(...customCommandQueue());
	e.customCommandRegistry.registerCommand(...customCommandSave());
});
