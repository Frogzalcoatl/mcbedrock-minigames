import "./dimensions/dimensions";
import "./commands/commands";
import "./items/hubItems";
import "./entities/tridentTracker";
import { world } from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
import { entityDimensionTransfer } from "./dimensions/dimensions";

world.afterEvents.playerSpawn.subscribe((e) => {
	entityDimensionTransfer(e.player, MinecraftDimensionTypes.Overworld);
});
