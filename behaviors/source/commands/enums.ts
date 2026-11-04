import type { CustomCommandRegistry } from "@minecraft/server";
import { gameIds, PACK_NAMESPACE } from "../tools/constants";

export const commandEnums = {
	roomTypeId: `${PACK_NAMESPACE}:roomTypeId`,
} as const;

export function registerCommandEnums(registry: CustomCommandRegistry): void {
	registry.registerEnum(commandEnums.roomTypeId, Object.values(gameIds));
}
