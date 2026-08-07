import {
	CommandPermissionLevel,
	type CustomCommand,
	type CustomCommandOrigin,
	type CustomCommandResult,
	CustomCommandStatus,
	type Player,
	system,
} from "@minecraft/server";
import { PACK_NAMESPACE } from "../../constants";
import { showRoomsForm } from "../../rooms/roomsForm";
import { getPlayerFromOrigin } from "../utils";

export function customCommandRooms(): [
	CustomCommand,
	(origin: CustomCommandOrigin) => CustomCommandResult | undefined,
] {
	return [
		{
			description: "Manage active rooms.",
			name: `${PACK_NAMESPACE}:rooms`,
			permissionLevel: CommandPermissionLevel.Admin,
		},
		(origin: CustomCommandOrigin): CustomCommandResult | undefined => {
			const player: Player | null = getPlayerFromOrigin(origin);
			if (player === null || !player.isValid) {
				return {
					message: "No valid player for ui.",
					status: CustomCommandStatus.Failure,
				};
			}
			system.run(() => {
				showRoomsForm(player);
			});
			return { status: CustomCommandStatus.Success };
		},
	];
}
