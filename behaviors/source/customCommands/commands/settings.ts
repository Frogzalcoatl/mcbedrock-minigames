import {
	CommandPermissionLevel,
	type CustomCommandOrigin,
	type CustomCommandRegistry,
	type CustomCommandResult,
	CustomCommandStatus,
	type Player,
	system,
} from "@minecraft/server";
import { PACK_NAMESPACE } from "../../constants";
import { showFormSettings } from "../../rooms/settings";
import { getPlayerFromOrigin } from "../origin";

export function registerCommandSettings(registry: CustomCommandRegistry): void {
	registry.registerCommand(
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
			} else if (player.commandPermissionLevel === CommandPermissionLevel.Any) {
				// No "/execute as <selector>" tomfoolery
				return {
					message: "Only operators can view this form.",
					status: CustomCommandStatus.Failure,
				};
			}
			system.run(() => showFormSettings(player));
			return { status: CustomCommandStatus.Success };
		},
	);
}
