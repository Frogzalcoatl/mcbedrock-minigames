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
import { roomTypes } from "../../rooms/roomManager";
import type { RoomType } from "../../rooms/roomType";
import { showRoomTypesForm, showRoomTypesRoomSelectForm } from "../../rooms/roomTypesForm";
import { commandEnums } from "../enums";
import { getPlayerFromOrigin } from "../utils";

export function customCommandQueue(): [
	CustomCommand,
	(origin: CustomCommandOrigin) => CustomCommandResult | undefined,
] {
	return [
		{
			description: "Join a game queue.",
			name: `${PACK_NAMESPACE}:queue`,
			optionalParameters: [
				{ name: commandEnums.roomTypeId, type: CustomCommandParamType.Enum },
			],
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
					showRoomTypesForm(player);
					return;
				}
				const roomType: RoomType | undefined = roomTypes.find(
					(t) => t.typeId === roomTypeId,
				);
				if (roomType !== undefined) {
					showRoomTypesRoomSelectForm(player, roomType, false);
				}
			});
			return {
				status: CustomCommandStatus.Success,
			};
		},
	];
}
