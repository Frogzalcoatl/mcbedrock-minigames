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
import { showFormAllProfiles, showFormPlayerProfile } from "../../player/formProfiles";
import { getPlayerFromOrigin } from "../utils";

export function registerCommandProfile(registry: CustomCommandRegistry): void {
	registry.registerCommand(
		{
			description: "View a player profile.",
			name: `${PACK_NAMESPACE}:profile`,
			optionalParameters: [{ name: "player", type: CustomCommandParamType.PlayerSelector }],
			permissionLevel: CommandPermissionLevel.Any,
		},
		(origin: CustomCommandOrigin, players?: Player[]): CustomCommandResult | undefined => {
			const viewer: Player | null = getPlayerFromOrigin(origin);
			if (viewer === null) {
				return {
					message: "No valid player for form.",
					status: CustomCommandStatus.Failure,
				};
			}
			if (players === undefined) {
				system.run(() => showFormAllProfiles(viewer));
				return {
					status: CustomCommandStatus.Success,
				};
			} else if (players.length > 1) {
				return {
					message: "Cannot select more than one player.",
					status: CustomCommandStatus.Failure,
				};
			}
			const player: Player | undefined = players[0];
			if (player === undefined) {
				return {
					message: "No valid player selected.",
					status: CustomCommandStatus.Failure,
				};
			} else {
				system.run(() => showFormPlayerProfile(viewer, player, false));
				return {
					status: CustomCommandStatus.Success,
				};
			}
		},
	);
}
