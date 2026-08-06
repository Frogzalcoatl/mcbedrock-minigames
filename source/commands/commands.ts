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
import { PACK_NAMESPACE } from "../constants";
import { showPlayerProfileForm, showPlayersForm } from "../player/playerForm";
import { joinRoomType, roomTypes } from "../rooms/roomManager";
import { showRoomsForm } from "../rooms/roomsForm";
import type { RoomType } from "../rooms/types/roomType";
import { showRoomTypeForm, showRoomTypeRoomSelectForm } from "../rooms/types/roomTypeForm";
import roomTypeIds from "../roomTypeIds";

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
	e.customCommandRegistry.registerEnum(structureEnumName, structureIds);
	const animationModeEnumName: string = `${PACK_NAMESPACE}:animationMode`;
	e.customCommandRegistry.registerEnum(
		animationModeEnumName,
		Object.values(StructureAnimationMode),
	);
	const roomTypeEnumName: string = `${PACK_NAMESPACE}:roomTypeId`;
	e.customCommandRegistry.registerEnum(roomTypeEnumName, Object.values(roomTypeIds));
	e.customCommandRegistry.registerCommand(
		{
			description: "Manage active rooms.",
			name: `${PACK_NAMESPACE}:rooms`,
			permissionLevel: CommandPermissionLevel.Admin,
		},
		(origin: CustomCommandOrigin): CustomCommandResult => {
			const player: Player | null = getPlayerFromOrigin(origin);
			if (player === null || !player.isValid) {
				return {
					message: "No valid player for ui",
					status: CustomCommandStatus.Failure,
				};
			}
			system.run(() => {
				showRoomsForm(player);
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
					joinRoomType(player, roomTypeIds.hub);
				});
			}
		},
	);
	e.customCommandRegistry.registerCommand(
		{
			description: "View a player profile.",
			name: `${PACK_NAMESPACE}:player`,
			optionalParameters: [{ name: "player", type: CustomCommandParamType.PlayerSelector }],
			permissionLevel: CommandPermissionLevel.Any,
		},
		(origin: CustomCommandOrigin, players?: Player[]): undefined | CustomCommandResult => {
			const viewer: Player | null = getPlayerFromOrigin(origin);
			if (viewer === null) {
				return {
					message: "No valid player for form.",
					status: CustomCommandStatus.Failure,
				};
			}
			if (players === undefined) {
				system.run(() => showPlayersForm(viewer));
				return;
			}
			const player: Player | undefined = players[0];
			if (player === undefined) {
				return {
					message: "No valid players selected.",
					status: CustomCommandStatus.Failure,
				};
			} else if (players.length > 1) {
				return {
					message: "Cannot select more than one player.",
					status: CustomCommandStatus.Failure,
				};
			} else {
				system.run(() => showPlayerProfileForm(viewer, player, false));
				return {
					status: CustomCommandStatus.Success,
				};
			}
		},
	);
	e.customCommandRegistry.registerCommand(
		{
			description: "Queue for a game.",
			name: `${PACK_NAMESPACE}:queue`,
			optionalParameters: [{ name: roomTypeEnumName, type: CustomCommandParamType.Enum }],
			permissionLevel: CommandPermissionLevel.Any,
		},
		(origin: CustomCommandOrigin, roomTypeId?: string): CustomCommandResult | undefined => {
			const player: Player | null = getPlayerFromOrigin(origin);
			if (player === null) {
				return {
					message: "No valid player to queue",
					status: CustomCommandStatus.Failure,
				};
			}
			system.run(() => {
				if (roomTypeId === undefined) {
					showRoomTypeForm(player);
					return;
				}
				const roomType: RoomType | undefined = roomTypes.find(
					(t) => t.typeId === roomTypeId,
				);
				if (roomType !== undefined) {
					showRoomTypeRoomSelectForm(player, roomType, false);
				}
			});
			return {
				status: CustomCommandStatus.Success,
			};
		},
	);
});
