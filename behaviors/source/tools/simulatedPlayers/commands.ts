import {
	type CommandPermissionLevel,
	type CustomCommandOrigin,
	CustomCommandParamType,
	type CustomCommandResult,
	CustomCommandStatus,
	type Dimension,
	type DimensionLocation,
	GameMode,
	type Player,
	type StartupEvent,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import { SimulatedPlayer } from "@minecraft/server-gametest";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
import { parseCommandGameMode, registerCommandGameModeEnum } from "../shared/commandGameMode";
import { getDimensionFromOrigin, getLocationFromOrigin } from "../shared/commandOrigin";
import type { SimulatedPlayerManager } from "./manager";

export function registerSimulatedPlayerCommands(
	manager: SimulatedPlayerManager,
	permissionLevel: CommandPermissionLevel,
): void {
	system.beforeEvents.startup.subscribe((event: StartupEvent): void => {
		const enumGameMode: string = registerCommandGameModeEnum(
			manager.namespace,
			event.customCommandRegistry,
		);
		event.customCommandRegistry.registerCommand(
			{
				description: "Spawn simulated players.",
				name: `${manager.namespace}:simspawn`,
				optionalParameters: [
					{ name: "amount", type: CustomCommandParamType.Integer },
					{ name: enumGameMode, type: CustomCommandParamType.Enum },
					{ name: "name", type: CustomCommandParamType.String },
				],
				permissionLevel: permissionLevel,
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
					message: `Spawning ${amount} simulated player${amount !== 1 ? "s" : ""}`,
					status: CustomCommandStatus.Success,
				};
			},
		);
		event.customCommandRegistry.registerCommand(
			{
				description: "Disconnect all simulated players.",
				name: `${manager.namespace}:simclear`,
				permissionLevel: permissionLevel,
			},
			(_origin: CustomCommandOrigin): CustomCommandResult | undefined => {
				system.run(() => {
					manager.clear();
				});
				let simulatedPlayerCount = 0;
				for (const p of world.getAllPlayers()) {
					if (p instanceof SimulatedPlayer) {
						simulatedPlayerCount++;
					}
				}
				let message: string;
				let status: CustomCommandStatus;
				if (simulatedPlayerCount > 0) {
					message = `Disconnecting ${simulatedPlayerCount} simulated player${simulatedPlayerCount !== 1 ? "s" : ""}`;
					status = CustomCommandStatus.Success;
				} else {
					message = "No simulated players to disconnect";
					status = CustomCommandStatus.Failure;
				}
				return {
					message: message,
					status: status,
				};
			},
		);
		event.customCommandRegistry.registerCommand(
			{
				description: "Disconnect simulated players by selector.",
				mandatoryParameters: [
					{ name: "playerSelector", type: CustomCommandParamType.PlayerSelector },
				],
				name: `${manager.namespace}:simdisconnect`,
				permissionLevel: permissionLevel,
			},
			(
				_origin: CustomCommandOrigin,
				playerSelector: Player[],
			): CustomCommandResult | undefined => {
				const willDisconnect: SimulatedPlayer[] = [];
				for (const p of playerSelector) {
					if (p instanceof SimulatedPlayer) {
						willDisconnect.push(p);
					}
				}
				system.run(() => {
					for (const p of playerSelector) {
						if (p.isValid && p instanceof SimulatedPlayer) {
							p.disconnect();
						}
					}
				});
				let status: CustomCommandStatus;
				let message: string;
				if (willDisconnect.length > 0) {
					status = CustomCommandStatus.Success;
					message = `Disconnecting ${willDisconnect.length} simulated player${willDisconnect.length !== 1 ? "s" : ""}...`;
				} else {
					status = CustomCommandStatus.Failure;
					message = "No simulated players to disconnect";
				}
				return {
					message: message,
					status: status,
				};
			},
		);
	});
}
