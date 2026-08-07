import {
	CommandPermissionLevel,
	type CustomCommand,
	type CustomCommandOrigin,
	CustomCommandParamType,
	type CustomCommandResult,
	CustomCommandStatus,
	type Dimension,
	type Player,
	system,
	type Vector3,
} from "@minecraft/server";
import { PACK_NAMESPACE } from "../../constants";
import { placeStructureBlocks } from "../../structures/save";
import { getDimensionFromOrigin, getPlayerFromOrigin } from "../utils";

export function customCommandSaveNew(): [
	CustomCommand,
	(origin: CustomCommandOrigin, from: Vector3, to: Vector3) => CustomCommandResult | undefined,
] {
	return [
		{
			description: "Place structure blocks for save based on bounds.",
			mandatoryParameters: [
				{ name: "from", type: CustomCommandParamType.Location },
				{ name: "to", type: CustomCommandParamType.Location },
			],
			name: `${PACK_NAMESPACE}:savenew`,
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
					message: "Unable to get dimension from command origin.",
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
					message: "Invalid y value.",
					status: CustomCommandStatus.Failure,
				};
			}
			const player: Player | null = getPlayerFromOrigin(origin);
			if (from.y === dimension.heightRange.min || to.y === dimension.heightRange.min) {
				if (player) {
					player.sendMessage(
						"§6You should increase your min y value so that structure blocks are not included in your save.",
					);
				}
			}
			system.run(() => {
				placeStructureBlocks(from, to, dimension);
			});
			return {
				status: CustomCommandStatus.Success,
			};
		},
	];
}
