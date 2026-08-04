import { system } from "@minecraft/server";
import { PACK_NAMESPACE } from "./constants";

export const TEST_DIMENSION_ID: string = `${PACK_NAMESPACE}:test`;
export const KITPVP_DIMENSION_ID: string = `${PACK_NAMESPACE}:kitpvp`;

system.beforeEvents.startup.subscribe((e) => {
	e.dimensionRegistry.registerCustomDimension(TEST_DIMENSION_ID);
	e.dimensionRegistry.registerCustomDimension(KITPVP_DIMENSION_ID);
});
