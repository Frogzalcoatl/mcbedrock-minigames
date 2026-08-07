import type { Kit } from "../../kits/kitManager";

export interface KitManager {
	kits: Kit[];
	entityKits: Map<string, number>; // [playerId, kitIndex]
}
