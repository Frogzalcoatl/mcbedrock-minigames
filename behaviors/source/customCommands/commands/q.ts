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
import { PACK_NAMESPACE } from "../../constants";
import { showFormTeleporter, showRoomTypesRoomSelect } from "../../rooms/formTeleporter";
import { roomTypes } from "../../rooms/roomManager";
import type { RoomType } from "../../rooms/roomType";
import { commandEnums } from "../enums";
import { getPlayerFromOrigin } from "../origin";

export function registerCommandQ(registry: CustomCommandRegistry): void {
	registry.registerCommand(
		{
			description: "Join a game queue.",
			name: `${PACK_NAMESPACE}:q`,
			optionalParameters: [
				{ name: commandEnums.roomTypeId, type: CustomCommandParamType.Enum },
			],
			permissionLevel: CommandPermissionLevel.Any,
		},
		(origin: CustomCommandOrigin, roomTypeId?: string): CustomCommandResult | undefined => {
			const player: Player | null = getPlayerFromOrigin(origin);
			if (player === null) {
				return {
					message: "No valid player to queue.",
					status: CustomCommandStatus.Failure,
				};
			}
			system.run(() => {
				if (roomTypeId === undefined) {
					showFormTeleporter(player);
					return;
				}
				const roomType: RoomType | undefined = roomTypes.find(
					(t) => t.typeId === roomTypeId,
				);
				if (roomType !== undefined) {
					showRoomTypesRoomSelect(player, roomType, false);
				}
			});
			return {
				status: CustomCommandStatus.Success,
			};
		},
	);
}
