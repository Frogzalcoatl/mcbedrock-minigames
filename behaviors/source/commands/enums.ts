import { type CustomCommandRegistry, StructureAnimationMode } from "@minecraft/server";
import { tools } from "../tools";
import { PACK_NAMESPACE, roomTypeIds } from "../tools/constants";

export const commandEnums = {
	animationMode: `${PACK_NAMESPACE}:animationMode`,
	roomTypeId: `${PACK_NAMESPACE}:roomTypeId`,
	structureIds: `${PACK_NAMESPACE}:structureId`,
} as const;

export function registerCommandEnums(registry: CustomCommandRegistry): void {
	registry.registerEnum(commandEnums.structureIds, tools.structures.ids);
	registry.registerEnum(commandEnums.animationMode, Object.values(StructureAnimationMode));
	registry.registerEnum(commandEnums.roomTypeId, Object.values(roomTypeIds));
}
