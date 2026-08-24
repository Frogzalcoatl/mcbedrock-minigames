import {
	CommandPermissionLevel,
	type CustomCommand,
	type CustomCommandOrigin,
	CustomCommandParamType,
	type CustomCommandResult,
	CustomCommandStatus,
	type Player,
	system,
} from "@minecraft/server";
import { PACK_NAMESPACE } from "../../constants";
import type { Room } from "../../rooms/room";
import type { RoomHub } from "../../rooms/roomHub";
import { getPlayerRoom, roomTypes } from "../../rooms/roomManager";
import type { RoomType } from "../../rooms/roomType";
import roomTypeIds from "../../roomTypeIds";
import { getPlayerFromOrigin } from "../utils";

export function customCommandHub(): [
	CustomCommand,
	(origin: CustomCommandOrigin, index?: number) => CustomCommandResult | undefined,
] {
	return [
		{
			description: "Transfer to hub.",
			name: `${PACK_NAMESPACE}:hub`,
			optionalParameters: [{ name: "id", type: CustomCommandParamType.Integer }],
			permissionLevel: CommandPermissionLevel.Any,
		},
		(
			origin: CustomCommandOrigin,
			displayIndex: number = 1,
		): CustomCommandResult | undefined => {
			const player: Player | null = getPlayerFromOrigin(origin);
			if (player === null) {
				return {
					message: "No valid player for hub transfer.",
					status: CustomCommandStatus.Failure,
				};
			}
			const playerRoom: Room | null = getPlayerRoom(player);
			if (playerRoom?.hub?.isActive && !playerRoom.hub.has(player)) {
				const hub: RoomHub = playerRoom.hub;
				system.run(() => {
					hub.join(player);
				});
				return;
			}
			const mainHubRoomType: RoomType | undefined = roomTypes.find(
				(r) => r.typeId === roomTypeIds.hub,
			);
			if (mainHubRoomType === undefined || mainHubRoomType.rooms.length === 0) {
				return {
					message: "No valid hubs found.",
					status: CustomCommandStatus.Failure,
				};
			}
			const actualIndex: number = displayIndex - 1;
			if (actualIndex >= mainHubRoomType.rooms.length || actualIndex < 0) {
				return {
					message: `Invalid hub id "${displayIndex}". Must be within range 1-${mainHubRoomType.rooms.length}.`,
					status: CustomCommandStatus.Failure,
				};
			}
			const room: Room | undefined = mainHubRoomType.rooms[actualIndex];
			if (room === undefined) {
				return {
					message: `Unable to join ${roomTypeIds.hub}-${displayIndex}.`,
					status: CustomCommandStatus.Failure,
				};
			}
			system.run(() => {
				room.join(player);
			});
			return {
				status: CustomCommandStatus.Success,
			};
		},
	];
}
