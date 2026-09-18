import type { EntityDieAfterEvent } from "@minecraft/server";
import { PACK_NAMESPACE, roomTypeIds } from "../../constants";
import { deathMessageFromEvent } from "../../tools/deathMessages";
import { Game } from "../../tools/games/game";
import { Room } from "../../tools/rooms/room";
import { type RoomCreatorFunc, roomTypeInit } from "../../tools/rooms/roomType";
import { type KillTrackerConfig, killTrackerAddDimension } from "../../tools/trackers/killTracker";

const creator: RoomCreatorFunc = (dimensionId: string, displayName: string, icon: string): Room => {
	const room = new Room({
		dimensionId: dimensionId,
		displayName: displayName,
		icon: icon,
		spawn: {
			facing: { x: 0.5, y: 0, z: 1 },
			pos: { x: 0.5, y: 0, z: 0.5 },
		},
	});
	const killTracker: KillTrackerConfig = killTrackerAddDimension(room.dimensionId);
	killTracker.onKill.subscribe((event: EntityDieAfterEvent) => {
		const message: string | null = deathMessageFromEvent(event, "§7");
		room.sendMessage(message);
	});
	new Game({
		maxPlayers: 2,
		playersPerTeam: 1,
		playersToStart: 2,
		room: room,
		spectatorPos: { x: 0.5, y: 0, z: 0.5 },
		teamCount: 2,
	});
	return room;
};

roomTypeInit({
	defaultDimensionId: `${PACK_NAMESPACE}:duels`,
	displayName: "Duels",
	icon: "textures/items/iron_sword.png",
	roomCount: 5,
	roomCreatorFunc: creator,
	typeId: roomTypeIds.duels,
});
