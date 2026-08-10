import "./customCommands/index";
import "./items/index";
import "./games/index";
import "./player/index";

import { world } from "@minecraft/server";
import { joinRoomType } from "./rooms/roomManager";
import roomTypeIds from "./roomTypeIds";

world.afterEvents.playerSpawn.subscribe((e) => {
	joinRoomType(e.player, roomTypeIds.hub);
});
