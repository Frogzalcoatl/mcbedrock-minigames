import {
	CommandPermissionLevel,
	type CustomCommand,
	type CustomCommandOrigin,
	CustomCommandParamType,
	type CustomCommandResult,
	CustomCommandStatus,
	type Dimension,
	StructureAnimationMode,
	system,
	type Vector3,
} from "@minecraft/server";
import { PACK_NAMESPACE } from "../../constants";
import { structureIds } from "../../structures/data";
import { loadStructure } from "../../structures/load";
import { commandEnums } from "../enums";
import { getDimensionFromOrigin, getLocationFromOrigin } from "../utils";

export function customCommandLoad(): [
	CustomCommand,
	(
		origin: CustomCommandOrigin,
		id: string,
		to?: Vector3,
		animationMode?: StructureAnimationMode,
		animationSeconds?: number,
	) => CustomCommandResult | undefined,
] {
	return [
		{
			description: "Load structure from minigame behavior pack.",
			mandatoryParameters: [
				{ name: commandEnums.structureIds, type: CustomCommandParamType.Enum },
			],
			name: `${PACK_NAMESPACE}:load`,
			optionalParameters: [
				{ name: "to", type: CustomCommandParamType.Location },
				{ name: commandEnums.animationMode, type: CustomCommandParamType.Enum },
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
					message: "Unable to get valid location from command origin",
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
	];
}
