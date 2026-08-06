import {
	CommandPermissionLevel,
	type CustomCommandOrigin,
	CustomCommandParamType,
	type CustomCommandResult,
	CustomCommandStatus,
	type Dimension,
	Player,
	StructureAnimationMode,
	system,
	type Vector3,
} from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
import { PACK_NAMESPACE } from "../constants";
import { showRoomNavForm } from "../rooms/roomForm";
import { joinRoom } from "../rooms/roomManager";
import { structureIds } from "../structures/data";
import { loadStructure } from "../structures/load";

function getPlayerFromOrigin(origin: CustomCommandOrigin): Player | null {
	return origin.initiator instanceof Player
		? origin.initiator
		: origin.sourceEntity instanceof Player
			? origin.sourceEntity
			: null;
}

function getDimensionFromOrigin(origin: CustomCommandOrigin): Dimension | null {
	const source = origin.sourceBlock ?? origin.sourceEntity ?? origin.initiator;
	if (source === undefined || !source.isValid) {
		return null;
	}
	return source.dimension;
}

function getLocationFromOrigin(origin: CustomCommandOrigin): Vector3 | null {
	const source = origin.sourceBlock ?? origin.sourceEntity ?? origin.initiator;
	if (source === undefined || !source.isValid) {
		return null;
	}
	return source.location;
}

system.beforeEvents.startup.subscribe((e) => {
	const structureEnumName: string = `${PACK_NAMESPACE}:structureId`;
	const animationModeEnumName: string = `${PACK_NAMESPACE}:animationMode`;
	e.customCommandRegistry.registerEnum(structureEnumName, structureIds);
	e.customCommandRegistry.registerEnum(
		animationModeEnumName,
		Object.values(StructureAnimationMode),
	);
	e.customCommandRegistry.registerCommand(
		{
			description: "Manage active rooms.",
			name: `${PACK_NAMESPACE}:room`,
			permissionLevel: CommandPermissionLevel.Admin,
		},
		(origin: CustomCommandOrigin): CustomCommandResult => {
			const player: Player | null = getPlayerFromOrigin(origin);
			if (player === null || !player.isValid) {
				return {
					message: "§cNo valid player for ui",
					status: CustomCommandStatus.Failure,
				};
			}
			system.run(() => {
				showRoomNavForm(player);
			});
			return { status: CustomCommandStatus.Success };
		},
	);
	e.customCommandRegistry.registerCommand(
		{
			description: "Load structure from minigame behavior pack.",
			mandatoryParameters: [{ name: structureEnumName, type: CustomCommandParamType.Enum }],
			name: `${PACK_NAMESPACE}:load`,
			optionalParameters: [
				{ name: "to", type: CustomCommandParamType.Location },
				{ name: animationModeEnumName, type: CustomCommandParamType.Enum },
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
			const location: Vector3 | null = getLocationFromOrigin(origin);
			if (dimension === null || location === null) {
				return {
					message: "§cUnable to get valid location from command origin",
					status: CustomCommandStatus.Failure,
				};
			}
			if (to !== undefined) {
				location.x = to.x;
				location.y = to.y;
				location.z = to.z;
			}
			if (!structureIds.includes(id)) {
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
				loadStructure(id, location, dimension, animationMode, animationSeconds),
			);
			return {
				status: CustomCommandStatus.Success,
			};
		},
	);
	e.customCommandRegistry.registerCommand(
		{
			description: "Go back to hub.",
			name: `${PACK_NAMESPACE}:hub`,
			permissionLevel: CommandPermissionLevel.Any,
		},
		(origin: CustomCommandOrigin): undefined => {
			const player: Player | null = getPlayerFromOrigin(origin);
			if (player !== null) {
				system.run(() => {
					joinRoom(player, MinecraftDimensionTypes.Overworld);
				});
			}
		},
	);
});
