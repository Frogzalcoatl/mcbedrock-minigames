import "./rooms/room";
import "./commands/commands";
import "./items/hubItems";
import "./entities/tridentTracker";
import { world } from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
import { joinRoom } from "./rooms/roomManager";

world.afterEvents.playerSpawn.subscribe((e) => {
	joinRoom(e.player, MinecraftDimensionTypes.Overworld);
});
