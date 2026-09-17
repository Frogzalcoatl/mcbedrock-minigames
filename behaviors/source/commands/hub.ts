import {
	CommandPermissionLevel,
	type CustomCommandOrigin,
	CustomCommandParamType,
	type CustomCommandRegistry,
	type CustomCommandResult,
	CustomCommandStatus,
	type Player,
	system,
} from "@minecraft/server";
import { PACK_NAMESPACE, roomTypeIds } from "../constants";
import { Room } from "../tools/rooms/room";
import type { RoomHub } from "../tools/rooms/roomHub";
import { type RoomType, roomTypeGet, roomTypeJoin } from "../tools/rooms/roomType";
import { getPlayerFromOrigin } from "./utils/origin";

export function registerCommandHub(registry: CustomCommandRegistry): void {
	registry.registerCommand(
		{
			description: "Transfer to hub.",
			name: `${PACK_NAMESPACE}:hub`,
			optionalParameters: [{ name: "id", type: CustomCommandParamType.Integer }],
			permissionLevel: CommandPermissionLevel.Any,
		},
		(origin: CustomCommandOrigin, displayIndex = 1): CustomCommandResult | undefined => {
			const player: Player | null = getPlayerFromOrigin(origin);
			if (player === null) {
				return {
					message: "No valid player for hub transfer",
					status: CustomCommandStatus.Failure,
				};
			}
			const playerRoom: Room | undefined = Room.findPlayer(player);
			if (playerRoom?.hub?.isActive && !playerRoom.hub.has(player)) {
				const hub: RoomHub = playerRoom.hub;
				system.run(() => {
					hub.join(player);
				});
				return;
			}
			const mainHubRoomType: RoomType | undefined = roomTypeGet(roomTypeIds.hub);
			if (mainHubRoomType === undefined) {
				return {
					message: "No valid hubs found",
					status: CustomCommandStatus.Failure,
				};
			}
			const actualIndex: number = displayIndex - 1;
			if (actualIndex >= mainHubRoomType.rooms.length || actualIndex < 0) {
				return {
					message: `Invalid hub id "${displayIndex}". Must be within range 1-${mainHubRoomType.rooms.length}`,
					status: CustomCommandStatus.Failure,
				};
			}
			system.run(() => {
				const joinResult: boolean = roomTypeJoin(player, mainHubRoomType, actualIndex);
				if (!joinResult) {
					player.sendMessage("§cUnable to join hub");
				}
			});
			return {
				status: CustomCommandStatus.Success,
			};
		},
	);
}
