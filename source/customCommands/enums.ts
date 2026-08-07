import { type CustomCommandRegistry, StructureAnimationMode } from "@minecraft/server";
import { PACK_NAMESPACE } from "../constants";
import roomTypeIds from "../roomTypeIds";
import { structureIds } from "../structures/data";

export const commandEnums = {
	animationMode: `${PACK_NAMESPACE}:animationMode`,
	roomTypeId: `${PACK_NAMESPACE}:roomTypeId`,
	structureIds: `${PACK_NAMESPACE}:structureId`,
} as const;

export function registerCommandEnums(registry: CustomCommandRegistry): void {
	registry.registerEnum(commandEnums.structureIds, structureIds);
	registry.registerEnum(commandEnums.animationMode, Object.values(StructureAnimationMode));
	registry.registerEnum(commandEnums.roomTypeId, Object.values(roomTypeIds));
}
