import "./commands/commands";
import "./items/index";

import { world } from "@minecraft/server";
import { joinRoomType } from "./rooms/roomManager";
import roomTypes from "./roomTypeNames";

world.afterEvents.playerSpawn.subscribe((e) => {
	joinRoomType(e.player, roomTypes.hub);
});
