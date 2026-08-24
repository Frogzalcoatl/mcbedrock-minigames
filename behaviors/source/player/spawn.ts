import { type DimensionLocation, world } from "@minecraft/server";
import type { Room } from "../rooms/room";
import { joinRoomType, rooms } from "../rooms/roomManager";
import roomTypeIds from "../roomTypeIds";

world.afterEvents.playerSpawn.subscribe((event) => {
	if (event.initialSpawn) {
		joinRoomType(event.player, roomTypeIds.hub);
		return;
	}
	const spawnPoint: DimensionLocation | undefined = event.player.getSpawnPoint();
	if (spawnPoint === undefined) {
		joinRoomType(event.player, roomTypeIds.hub);
		return;
	}
	const room: Room | undefined = rooms.get(spawnPoint.dimension.id);
	if (room === undefined) {
		joinRoomType(event.player, roomTypeIds.hub);
		return;
	}
	room.join(event.player);
});
