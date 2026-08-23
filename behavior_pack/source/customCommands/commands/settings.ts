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
import { showFormSettings } from "../../rooms/settings";
import { getPlayerFromOrigin } from "../utils";

export function customCommandSettings(): [
	CustomCommand,
	(origin: CustomCommandOrigin) => CustomCommandResult | undefined,
] {
	return [
		{
			description: "Manage active rooms.",
			name: `${PACK_NAMESPACE}:settings`,
			permissionLevel: CommandPermissionLevel.Admin,
		},
		(origin: CustomCommandOrigin): CustomCommandResult | undefined => {
			const player: Player | null = getPlayerFromOrigin(origin);
			if (player === null) {
				return {
					message: "No valid player for ui.",
					status: CustomCommandStatus.Failure,
				};
			}
			system.run(() => showFormSettings(player));
			return { status: CustomCommandStatus.Success };
		},
	];
}
