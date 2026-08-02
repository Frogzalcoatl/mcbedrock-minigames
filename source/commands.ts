import {
	CommandPermissionLevel,
	type CustomCommand,
	type CustomCommandOrigin,
	CustomCommandParamType,
	type CustomCommandResult,
	CustomCommandStatus,
	type Dimension,
	type DimensionLocation,
	Player,
	StructureAnimationMode,
	system,
	type Vector3,
} from "@minecraft/server";
import { PACK_NAMESPACE } from "./constants";
import { showDimensionNavForm } from "./dimesnionNavForm";
import { isOurStructureId, ourStructureIds } from "./structures/data";
import { loadOurStructure } from "./structures/load";

function getPlayerFromOrigin(origin: CustomCommandOrigin): Player | undefined {
	let player: Player | undefined;
	if (origin.initiator !== undefined && origin.initiator instanceof Player) {
		player = origin.initiator;
	} else if (origin.sourceEntity !== undefined && origin.sourceEntity instanceof Player) {
		player = origin.sourceEntity;
	}
	return player;
}

function getDimensionLocationFromOrigin(
	origin: CustomCommandOrigin,
	locationOverride?: Vector3,
): DimensionLocation | undefined {
	let dimension: Dimension;
	if (origin.sourceBlock !== undefined) {
		dimension = origin.sourceBlock.dimension;
	} else if (origin.sourceEntity !== undefined) {
		dimension = origin.sourceEntity.dimension;
	} else if (origin.initiator !== undefined) {
		dimension = origin.initiator.dimension;
	} else {
		return undefined;
	}
	let location: Vector3;
	if (locationOverride !== undefined) {
		location = locationOverride;
	} else if (origin.sourceBlock !== undefined) {
		location = origin.sourceBlock.location;
	} else if (origin.sourceEntity !== undefined) {
		location = origin.sourceEntity.location;
	} else if (origin.initiator !== undefined) {
		location = origin.initiator.location;
	} else {
		return undefined;
	}
	return {
		dimension: dimension,
		x: location.x,
		y: location.y,
		z: location.z,
	};
}

const dimension: CustomCommand = {
	description: "Transfer to another dimension.",
	name: `${PACK_NAMESPACE}:dim`,
	permissionLevel: CommandPermissionLevel.Admin,
};

function dimensionCallback(origin: CustomCommandOrigin): CustomCommandResult {
	const player: Player | undefined = getPlayerFromOrigin(origin);
	if (player === undefined || !player.isValid) {
		return {
			message: "§cNo valid player for ui",
			status: CustomCommandStatus.Failure,
		};
	}
	system.run(() => {
		showDimensionNavForm(player);
	});
	return { status: CustomCommandStatus.Success };
}

const structureEnumName: string = `${PACK_NAMESPACE}:ourStructure`;
const animationModeEnumName: string = `${PACK_NAMESPACE}:animationMode`;

const structure: CustomCommand = {
	description: "Load structure from minigame behavior pack.",
	mandatoryParameters: [{ name: structureEnumName, type: CustomCommandParamType.Enum }],
	name: `${PACK_NAMESPACE}:structure`,
	optionalParameters: [
		{ name: "to", type: CustomCommandParamType.Location },
		{ name: animationModeEnumName, type: CustomCommandParamType.Enum },
		{ name: "anumationSeconds", type: CustomCommandParamType.Integer },
	],
	permissionLevel: CommandPermissionLevel.Host,
};

function structureCallback(
	origin: CustomCommandOrigin,
	id: string,
	to?: Vector3,
	animationMode?: StructureAnimationMode,
	animationSeconds?: number,
): CustomCommandResult {
	const location: DimensionLocation | undefined = getDimensionLocationFromOrigin(origin, to);
	if (!location) {
		return {
			message: "§cUnable to get valid location from command origin",
			status: CustomCommandStatus.Failure,
		};
	}
	if (!isOurStructureId(id)) {
		return {
			message: `Invalid structure id "${id}"`,
			status: CustomCommandStatus.Failure,
		};
	}
	system.run(() => loadOurStructure(id, location, animationMode, animationSeconds));
	return {
		status: CustomCommandStatus.Success,
	};
}

system.beforeEvents.startup.subscribe((e) => {
	e.customCommandRegistry.registerCommand(dimension, dimensionCallback);
	e.customCommandRegistry.registerEnum(structureEnumName, ourStructureIds);
	e.customCommandRegistry.registerEnum(
		animationModeEnumName,
		Object.values(StructureAnimationMode),
	);
	e.customCommandRegistry.registerCommand(structure, structureCallback);
});
