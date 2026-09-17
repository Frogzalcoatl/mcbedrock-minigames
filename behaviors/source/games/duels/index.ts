import type { EntityDieAfterEvent } from "@minecraft/server";
import { deathMessageFromEvent } from "../../tools/deathMessages";
import { GameStateManager } from "../../tools/gameStates";
import { Room } from "../../tools/rooms/room";
import type { RoomCreationFunc } from "../../tools/rooms/roomType";
import { type KillTrackerConfig, killTrackerAddDimension } from "../../tools/trackers/killTracker";

export const getRoomDuels: RoomCreationFunc = (
	roomTypeIndex: number,
	roomIndex: number,
	dimensionId: string,
	displayName: string,
	icon: string,
): Room => {
	const room = new Room({
		dimensionId: dimensionId,
		displayName: displayName,
		icon: icon,
		includeHub: false,
		roomIndex: roomIndex,
		roomTypeIndex: roomTypeIndex,
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
	const game = new GameStateManager({
		maxPlayers: 2,
		playersPerTeam: 1,
		playersToStart: 2,
		room: room,
		spectatorPos: { x: 0.5, y: 0, z: 0.5 },
		teamCount: 2,
	});

	return room;
};
