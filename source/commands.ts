import {
	CommandPermissionLevel,
	type CustomCommandOrigin,
	CustomCommandParamType,
	type CustomCommandResult,
	CustomCommandStatus,
	type DimensionLocation,
	Player,
	StructureAnimationMode,
	system,
	type Vector3,
} from "@minecraft/server";
import { PACK_NAMESPACE } from "./constants";
import { showDimensionNavForm } from "./dimensionNavForm";
import { isOurStructureId, ourStructureIds } from "./structures/data";
import { loadOurStructure } from "./structures/load";

function getPlayerFromOrigin(origin: CustomCommandOrigin): Player | null {
	return origin.initiator instanceof Player
		? origin.initiator
		: origin.sourceEntity instanceof Player
			? origin.sourceEntity
			: null;
}

function getDimensionLocationFromOrigin(origin: CustomCommandOrigin): DimensionLocation | null {
	const source = origin.sourceBlock ?? origin.sourceEntity ?? origin.initiator;
	if (source === undefined) {
		return null;
	} else {
		return {
			dimension: source.dimension,
			x: source.location.x,
			y: source.location.y,
			z: source.location.z,
		};
	}
}

system.beforeEvents.startup.subscribe((e) => {
	const structureEnumName: string = `${PACK_NAMESPACE}:ourStructure`;
	const animationModeEnumName: string = `${PACK_NAMESPACE}:animationMode`;
	e.customCommandRegistry.registerEnum(structureEnumName, ourStructureIds);
	e.customCommandRegistry.registerEnum(
		animationModeEnumName,
		Object.values(StructureAnimationMode),
	);
	e.customCommandRegistry.registerCommand(
		{
			description: "Transfer to another dimension.",
			name: `${PACK_NAMESPACE}:dim`,
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
				showDimensionNavForm(player);
			});
			return { status: CustomCommandStatus.Success };
		},
	);
	e.customCommandRegistry.registerCommand(
		{
			description: "Load structure from minigame behavior pack.",
			mandatoryParameters: [{ name: structureEnumName, type: CustomCommandParamType.Enum }],
			name: `${PACK_NAMESPACE}:structure`,
			optionalParameters: [
				{ name: "to", type: CustomCommandParamType.Location },
				{ name: animationModeEnumName, type: CustomCommandParamType.Enum },
				{ name: "animationSeconds", type: CustomCommandParamType.Integer },
			],
			permissionLevel: CommandPermissionLevel.Host,
		},
		(
			origin: CustomCommandOrigin,
			id: string,
			to?: Vector3,
			animationMode?: StructureAnimationMode,
			animationSeconds?: number,
		): CustomCommandResult => {
			const location: DimensionLocation | null = getDimensionLocationFromOrigin(origin);
			if (location === null) {
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
			if (!isOurStructureId(id)) {
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
			system.run(() => loadOurStructure(id, location, animationMode, animationSeconds));
			return {
				status: CustomCommandStatus.Success,
			};
		},
	);
});
