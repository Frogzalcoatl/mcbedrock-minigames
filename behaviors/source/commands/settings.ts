import {
	CommandPermissionLevel,
	type CustomCommandOrigin,
	type CustomCommandRegistry,
	type CustomCommandResult,
	CustomCommandStatus,
	type Player,
	system,
} from "@minecraft/server";
import { showFormSettings } from "../forms/settings";
import { PACK_NAMESPACE } from "../tools/constants";
import { getPlayerFromOrigin } from "../tools/helpers/commandOrigin";

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
					message: "No valid player for ui",
					status: CustomCommandStatus.Failure,
				};
			}
			system.run(() => {
				showFormSettings(player);
			});
			return { status: CustomCommandStatus.Success };
		},
	);
}
