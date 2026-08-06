import { world } from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
import { joinRoom } from "./rooms/roomManager";
import "./commands/commands";
import "./items/hubItems";

world.afterEvents.playerSpawn.subscribe((e) => {
	joinRoom(e.player, MinecraftDimensionTypes.Overworld);
});
