import {
	CommandPermissionLevel,
	type CustomCommandOrigin,
	CustomCommandParamType,
	type CustomCommandResult,
	CustomCommandStatus,
	type Dimension,
	type Player,
	type StartupEvent,
	StructureAnimationMode,
	system,
	type Vector3,
} from "@minecraft/server";
import {
	getDimensionFromOrigin,
	getLocationFromOrigin,
	getPlayerFromOrigin,
} from "../../shared/commandOrigin";
import type { StructureSchemaManager } from "./manager";

export function registerStructureCommands(schemaManager: StructureSchemaManager): void {
	system.beforeEvents.startup.subscribe((event: StartupEvent): void => {
		const enumStructureIds: string = `${schemaManager.namespace}:ssm_structure_ids`;
		const enumAnimationMode: string = `${schemaManager.namespace}:ssm_animation_mode`;
		event.customCommandRegistry.registerEnum(enumStructureIds, [...schemaManager.ids]);
		event.customCommandRegistry.registerEnum(
			enumAnimationMode,
			Object.values(StructureAnimationMode),
		);
		event.customCommandRegistry.registerCommand(
			{
				description: "Load structure from behavior pack.",
				mandatoryParameters: [{ name: enumStructureIds, type: CustomCommandParamType.Enum }],
				name: `${schemaManager.namespace}:load`,
				optionalParameters: [
					{ name: "to", type: CustomCommandParamType.Location },
					{
						name: enumAnimationMode,
						type: CustomCommandParamType.Enum,
					},
					{ name: "animationSeconds", type: CustomCommandParamType.Integer },
				],
				permissionLevel: CommandPermissionLevel.Admin,
			},
			(
				origin: CustomCommandOrigin,
				id: string,
				to?: Vector3,
				animationMode?: StructureAnimationMode,
				animationSeconds?: number,
			): CustomCommandResult => {
				const dimension: Dimension | null = getDimensionFromOrigin(origin);
				if (dimension === null) {
					return {
						message: "Unable to get valid dimension from command origin",
						status: CustomCommandStatus.Failure,
					};
				}
				if (to === undefined) {
					const originLocation: Vector3 | null = getLocationFromOrigin(origin);
					if (originLocation === null) {
						return {
							message: "Unable to get location from command origin",
							status: CustomCommandStatus.Failure,
						};
					}
					to = originLocation;
				}
				if (!schemaManager.ids.has(id)) {
					return {
						message: `Invalid structure id "${id}"`,
						status: CustomCommandStatus.Failure,
					};
				}
				if (
					animationMode !== undefined &&
					!Object.values(StructureAnimationMode).includes(animationMode)
				) {
					return {
						message: `Invalid animation mode "${animationMode}"`,
						status: CustomCommandStatus.Failure,
					};
				}
				if (animationSeconds !== undefined && animationSeconds < 0) {
					return {
						message: `Animation seconds must be a non negative integer`,
						status: CustomCommandStatus.Failure,
					};
				}
				system.run(() =>
					schemaManager.load(id, to, dimension, animationMode, animationSeconds),
				);
				return {
					status: CustomCommandStatus.Success,
				};
			},
		);
		event.customCommandRegistry.registerCommand(
			{
				description: "Place structure blocks for save based on existing structure.",
				mandatoryParameters: [
					{
						name: enumStructureIds,
						type: CustomCommandParamType.Enum,
					},
				],
				name: `${schemaManager.namespace}:existingsave`,
				optionalParameters: [{ name: "at", type: CustomCommandParamType.Location }],
				permissionLevel: CommandPermissionLevel.Admin,
			},
			(
				origin: CustomCommandOrigin,
				structureId: string,
				at?: Vector3,
			): CustomCommandResult | undefined => {
				const dimension: Dimension | null = getDimensionFromOrigin(origin);
				if (dimension === null) {
					return {
						message: "Unable to get dimension from command origin",
						status: CustomCommandStatus.Failure,
					};
				}
				if (at === undefined) {
					const originLocation: Vector3 | null = getLocationFromOrigin(origin);
					if (originLocation === null) {
						return {
							message: "Unable to get location from command origin",
							status: CustomCommandStatus.Failure,
						};
					}
					at = originLocation;
				}
				if (!schemaManager.ids.has(structureId)) {
					return {
						message: `Invalid structure id "${structureId}"`,
						status: CustomCommandStatus.Failure,
					};
				}
				const player: Player | null = getPlayerFromOrigin(origin);
				system.run(() => {
					schemaManager.placeStructureBlocksFor(structureId, at, dimension);
					if (player?.isValid) {
						player.sendMessage(
							"§6You probably need to change the structure block sizes. There is no feasible way for me to edit them through scripting",
						);
					}
				});
				return {
					status: CustomCommandStatus.Success,
				};
			},
		);
		event.customCommandRegistry.registerCommand(
			{
				description: "Place structure blocks for save based on bounds.",
				mandatoryParameters: [
					{ name: "from", type: CustomCommandParamType.Location },
					{ name: "to", type: CustomCommandParamType.Location },
				],
				name: `${schemaManager.namespace}:newsave`,
				permissionLevel: CommandPermissionLevel.Admin,
			},
			(
				origin: CustomCommandOrigin,
				from: Vector3,
				to: Vector3,
			): CustomCommandResult | undefined => {
				const dimension: Dimension | null = getDimensionFromOrigin(origin);
				if (dimension === null) {
					return {
						message: "Unable to get dimension from command origin",
						status: CustomCommandStatus.Failure,
					};
				}
				if (
					from.y < dimension.heightRange.min ||
					to.y < dimension.heightRange.min ||
					from.y > dimension.heightRange.max ||
					to.y > dimension.heightRange.max
				) {
					return {
						message: "Invalid y value",
						status: CustomCommandStatus.Failure,
					};
				}
				const player: Player | null = getPlayerFromOrigin(origin);
				if (from.y === dimension.heightRange.min || to.y === dimension.heightRange.min) {
					// When structure is at worldheight min, structure blocks are within bounds of save.
					// Just sending message as a warning
					if (player) {
						player.sendMessage(
							"§6You should increase your min y value so that structure blocks are not included in your save",
						);
					}
				}
				system.run(() => {
					schemaManager.placeStructureBlocks(from, to, dimension);
				});
				return {
					status: CustomCommandStatus.Success,
				};
			},
		);
	});
}
