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
import { PACK_NAMESPACE } from "../constants";
import { formRoomType } from "../forms/roomType";
import { showFormTeleporter } from "../forms/teleporter";
import { type RoomType, roomTypeGet, roomTypeJoin } from "../tools/room/roomType";
import { commandEnums } from "./utils/enums";
import { getPlayerFromOrigin } from "./utils/origin";

export function registerCommandQ(registry: CustomCommandRegistry): void {
	registry.registerCommand(
		{
			description: "Join a game queue.",
			name: `${PACK_NAMESPACE}:q`,
			optionalParameters: [{ name: commandEnums.roomTypeId, type: CustomCommandParamType.Enum }],
			permissionLevel: CommandPermissionLevel.Any,
		},
		(origin: CustomCommandOrigin, roomTypeId?: string): CustomCommandResult | undefined => {
			const player: Player | null = getPlayerFromOrigin(origin);
			if (player === null) {
				return {
					message: "No valid player to queue",
					status: CustomCommandStatus.Failure,
				};
			}
			system.run(() => {
				if (roomTypeId === undefined) {
					showFormTeleporter(player);
					return;
				}
				const roomType: RoomType | undefined = roomTypeGet(roomTypeId);
				if (roomType === undefined) {
					player.sendMessage(`§cUnable to find "${roomTypeId}"`);
					return;
				}
				if (roomType.rooms.length === 1) {
					roomTypeJoin(player, roomType);
				} else {
					formRoomType(player, roomType);
				}
			});
			return {
				status: CustomCommandStatus.Success,
			};
		},
	);
}
