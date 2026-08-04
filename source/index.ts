import "./dimensions";
import "./commands";
import "./items";
import "./tridentTracker";
import { world } from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
import { entityDimensionTransfer } from "./dimensions";

world.afterEvents.playerSpawn.subscribe((e) => {
	entityDimensionTransfer(e.player, MinecraftDimensionTypes.Overworld);
});
