import { world } from "@minecraft/server";
import type { Room } from "../rooms/room";
import { getPlayerRoom } from "../rooms/roomManager";

world.beforeEvents.playerLeave.subscribe((event) => {
	const room: Room | null = getPlayerRoom(event.player);
	if (room !== null) {
		room.removePlayer(event.player);
	}
});
