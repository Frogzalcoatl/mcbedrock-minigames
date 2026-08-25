import {
	CommandPermissionLevel,
	type CustomCommandOrigin,
	type CustomCommandRegistry,
	type CustomCommandResult,
	CustomCommandStatus,
	system,
	world,
} from "@minecraft/server";
import { SimulatedPlayer } from "@minecraft/server-gametest";
import { PACK_NAMESPACE } from "../../constants";

export function registerCommandClearSim(registry: CustomCommandRegistry): void {
	registry.registerCommand(
		{
			description: "Clear simulated players.",
			name: `${PACK_NAMESPACE}:clearsim`,
			permissionLevel: CommandPermissionLevel.Admin,
		},
		(_origin: CustomCommandOrigin): CustomCommandResult | undefined => {
			system.run(() => {
				for (const p of world.getAllPlayers()) {
					if (p instanceof SimulatedPlayer) {
						p.disconnect();
					}
				}
			});
			return {
				status: CustomCommandStatus.Success,
			};
		},
	);
}
