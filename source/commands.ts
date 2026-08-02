import {
	CommandPermissionLevel,
	type CustomCommand,
	type CustomCommandOrigin,
	CustomCommandParamType,
	type CustomCommandResult,
	CustomCommandStatus,
	type DimensionLocation,
	Player,
	system,
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
): DimensionLocation | undefined {
	if (origin.sourceBlock) {
		return {
			dimension: origin.sourceBlock.dimension,
			x: origin.sourceBlock.x,
			y: origin.sourceBlock.y,
			z: origin.sourceBlock.z,
		};
	}
	if (origin.sourceEntity) {
		return {
			dimension: origin.sourceEntity.dimension,
			x: origin.sourceEntity.location.x,
			y: origin.sourceEntity.location.y,
			z: origin.sourceEntity.location.z,
		};
	}
	if (origin.initiator) {
		return {
			dimension: origin.initiator.dimension,
			x: origin.initiator.location.x,
			y: origin.initiator.location.y,
			z: origin.initiator.location.z,
		};
	}
	return undefined;
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

const structure: CustomCommand = {
	description: "Load structure from minigame behavior pack.",
	mandatoryParameters: [{ name: structureEnumName, type: CustomCommandParamType.Enum }],
	name: `${PACK_NAMESPACE}:structure`,
	permissionLevel: CommandPermissionLevel.Host,
};

function structureCallback(origin: CustomCommandOrigin, id: string): CustomCommandResult {
	const location: DimensionLocation | undefined = getDimensionLocationFromOrigin(origin);
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
	system.run(() => loadOurStructure(id, location));
	return {
		status: CustomCommandStatus.Success,
	};
}

system.beforeEvents.startup.subscribe((e) => {
	e.customCommandRegistry.registerCommand(dimension, dimensionCallback);
	e.customCommandRegistry.registerEnum(structureEnumName, Object.keys(ourStructureIds));
	e.customCommandRegistry.registerCommand(structure, structureCallback);
});
