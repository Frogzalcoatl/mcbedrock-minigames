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
import { placeStructureBlocks } from "../../structures/save";
import { getDimensionFromOrigin, getPlayerFromOrigin } from "../origin";

export function registerCommandNewSave(registry: CustomCommandRegistry): void {
	registry.registerCommand(
		{
			description: "Place structure blocks for save based on bounds.",
			mandatoryParameters: [
				{ name: "from", type: CustomCommandParamType.Location },
				{ name: "to", type: CustomCommandParamType.Location },
			],
			name: `${PACK_NAMESPACE}:newsave`,
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
				// Load structure blocks with y offset of 0 instead of the usual 1.
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
	);
}
