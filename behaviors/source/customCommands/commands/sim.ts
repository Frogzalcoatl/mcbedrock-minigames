import {
	CommandPermissionLevel,
	type CustomCommandOrigin,
	CustomCommandParamType,
	type CustomCommandRegistry,
	type CustomCommandResult,
	CustomCommandStatus,
	type Dimension,
	GameMode,
	system,
	world,
} from "@minecraft/server";
import { spawnSimulatedPlayer } from "@minecraft/server-gametest";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
import { PACK_NAMESPACE } from "../../constants";
import { getDimensionFromOrigin } from "../origin";

export function registerCommandSim(registry: CustomCommandRegistry): void {
	registry.registerCommand(
		{
			description: "Spawn simulated players.",
			name: `${PACK_NAMESPACE}:sim`,
			optionalParameters: [
				{ name: "amount", type: CustomCommandParamType.Integer },
				{ name: "name", type: CustomCommandParamType.String },
			],
			permissionLevel: CommandPermissionLevel.Admin,
		},
		(
			origin: CustomCommandOrigin,
			amount: number = 1,
			name: string = "SimulatedPlayer",
		): CustomCommandResult | undefined => {
			if (amount <= 0) {
				return {
					message: "Amount must be an integer greater than 0",
					status: CustomCommandStatus.Failure,
				};
			}
			let dimension: Dimension | null = getDimensionFromOrigin(origin);
			if (dimension === null) {
				dimension = world.getDimension(MinecraftDimensionTypes.Overworld);
			}
			system.run(() => {
				for (let i: number = 0; i < amount; i++) {
					spawnSimulatedPlayer(
						{ dimension: dimension, x: 0, y: 0, z: 0 },
						name,
						GameMode.Adventure,
					);
				}
			});
			return {
				status: CustomCommandStatus.Success,
			};
		},
	);
}
