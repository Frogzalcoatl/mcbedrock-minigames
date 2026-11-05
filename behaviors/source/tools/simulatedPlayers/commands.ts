import {
	CommandPermissionLevel,
	type CustomCommandOrigin,
	CustomCommandParamType,
	type CustomCommandResult,
	CustomCommandStatus,
	type Dimension,
	type DimensionLocation,
	GameMode,
	type StartupEvent,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
import { parseCommandGameMode, registerCommandGameModeEnum } from "../shared/commandGameMode";
import { getDimensionFromOrigin, getLocationFromOrigin } from "../shared/commandOrigin";
import type { SimulatedPlayerManager } from "./manager";

export function registerSimulatedPlayerCommands(manager: SimulatedPlayerManager): void {
	system.beforeEvents.startup.subscribe((event: StartupEvent): void => {
		const enumGameMode: string = registerCommandGameModeEnum(
			manager.namespace,
			event.customCommandRegistry,
		);
		event.customCommandRegistry.registerCommand(
			{
				description: "Spawn simulated players.",
				name: `${manager.namespace}:sim`,
				optionalParameters: [
					{ name: "amount", type: CustomCommandParamType.Integer },
					{ name: enumGameMode, type: CustomCommandParamType.Enum },
					{ name: "name", type: CustomCommandParamType.String },
				],
				permissionLevel: CommandPermissionLevel.Admin,
			},
			(
				origin: CustomCommandOrigin,
				amount = 1,
				gameModeStr: string = GameMode.Adventure,
				name = "SimulatedPlayer",
			): CustomCommandResult | undefined => {
				if (amount <= 0) {
					return {
						message: "Amount must be an integer greater than 0",
						status: CustomCommandStatus.Failure,
					};
				}
				const gameMode: GameMode | undefined = parseCommandGameMode(gameModeStr);
				if (gameMode === undefined) {
					return {
						message: `Invalid GameMode "${gameModeStr}"`,
						status: CustomCommandStatus.Failure,
					};
				}
				let dimension: Dimension | null = getDimensionFromOrigin(origin);
				if (dimension === null) {
					dimension = world.getDimension(MinecraftDimensionTypes.Overworld);
				}
				const pos: Vector3 = getLocationFromOrigin(origin) ?? { x: 0.5, y: 0, z: 0.5 };
				system.run(() => {
					const location: DimensionLocation = {
						dimension: dimension,
						x: pos.x,
						y: pos.y,
						z: pos.z,
					};
					manager.spawn(location, amount, name, gameMode);
				});
				return {
					status: CustomCommandStatus.Success,
				};
			},
		);
		event.customCommandRegistry.registerCommand(
			{
				description: "Clear simulated players.",
				name: `${manager.namespace}:clearsim`,
				permissionLevel: CommandPermissionLevel.Admin,
			},
			(_origin: CustomCommandOrigin): CustomCommandResult | undefined => {
				system.run(() => {
					manager.clear();
				});
				return {
					status: CustomCommandStatus.Success,
				};
			},
		);
	});
}
