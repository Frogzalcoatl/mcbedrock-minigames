import {
	CommandPermissionLevel,
	type CustomCommand,
	type CustomCommandOrigin,
	type CustomCommandResult,
	type Player,
	system,
} from "@minecraft/server";
import { PACK_NAMESPACE } from "../../constants";
import { joinRoomType } from "../../rooms/roomManager";
import roomTypeIds from "../../roomTypeIds";
import { getPlayerFromOrigin } from "../utils";

export function customCommandHub(): [
	CustomCommand,
	(origin: CustomCommandOrigin) => CustomCommandResult | undefined,
] {
	return [
		{
			description: "Go back to hub.",
			name: `${PACK_NAMESPACE}:hub`,
			permissionLevel: CommandPermissionLevel.Any,
		},
		(origin: CustomCommandOrigin): undefined => {
			const player: Player | null = getPlayerFromOrigin(origin);
			if (player !== null) {
				system.run(() => {
					joinRoomType(player, roomTypeIds.hub);
				});
			}
		},
	];
}
