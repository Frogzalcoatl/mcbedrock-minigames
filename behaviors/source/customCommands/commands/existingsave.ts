import {
	CommandPermissionLevel,
	type CustomCommandOrigin,
	CustomCommandParamType,
	type CustomCommandRegistry,
	type CustomCommandResult,
	CustomCommandStatus,
	type Dimension,
	type Player,
	system,
	type Vector3,
} from "@minecraft/server";
import { PACK_NAMESPACE } from "../../constants";
import { structureIds } from "../../structures/data";
import { placeStructureBlocksFor } from "../../structures/save";
import { commandEnums } from "../enums";
import { getDimensionFromOrigin, getLocationFromOrigin, getPlayerFromOrigin } from "../utils";

export function registerCommandExistingSave(registry: CustomCommandRegistry): void {
	registry.registerCommand(
		{
			description: "Place structure blocks for save based on existing structure.",
			mandatoryParameters: [
				{ name: commandEnums.structureIds, type: CustomCommandParamType.Enum },
			],
			name: `${PACK_NAMESPACE}:existingsave`,
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
					message: "Unable to get dimension from command origin.",
					status: CustomCommandStatus.Failure,
				};
			}
			if (at === undefined) {
				const originLocation: Vector3 | null = getLocationFromOrigin(origin);
				if (originLocation === null) {
					return {
						message: "Unable to get location from command origin.",
						status: CustomCommandStatus.Failure,
					};
				}
				at = originLocation;
			}
			if (!structureIds.includes(structureId)) {
				return {
					message: `Invalid structure id "${structureId}".`,
					status: CustomCommandStatus.Failure,
				};
			}
			const player: Player | null = getPlayerFromOrigin(origin);
			system.run(() => {
				placeStructureBlocksFor(structureId, at, dimension);
				if (player?.isValid) {
					player.sendMessage(
						"§6You probably need to change the structure block sizes. There is no feasible way for me to edit them through scripting.",
					);
				}
			});
			return {
				status: CustomCommandStatus.Success,
			};
		},
	);
}
