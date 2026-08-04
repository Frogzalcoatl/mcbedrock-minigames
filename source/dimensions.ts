import { type Dimension, type Player, system, type Vector3, world } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
import { PACK_NAMESPACE } from "./constants";

export const KITPVP_DIMENSION_ID: string = `${PACK_NAMESPACE}:kitpvp`;

system.beforeEvents.startup.subscribe((e) => {
	e.dimensionRegistry.registerCustomDimension(KITPVP_DIMENSION_ID);
});

interface DimensionSpawn {
	id: string;
	location: Vector3;
}

const DimensionSpawns: DimensionSpawn[] = [
	{ id: MinecraftDimensionTypes.Overworld, location: { x: 55.5, y: 11, z: 59.5 } },
	{ id: KITPVP_DIMENSION_ID, location: { x: 194.5, y: 9, z: 75.5 } },
];

export async function showDimensionNavForm(player: Player): Promise<void> {
	if (!player.isValid) {
		return;
	}
	const form: ActionFormData = new ActionFormData();
	form.title("Dimension Navigation");
	for (const d of DimensionSpawns) {
		form.button(d.id);
	}
	const resp: ActionFormResponse = await form.show(player);
	if (resp.selection === undefined || !player.isValid) {
		return;
	}
	const dimensionSpawn: DimensionSpawn | undefined = DimensionSpawns[resp.selection];
	if (dimensionSpawn === undefined) {
		return;
	}
	const dimension: Dimension | undefined = world.getDimension(dimensionSpawn.id);
	if (dimension === undefined) {
		return;
	}
	player.teleport(dimensionSpawn.location, { dimension: dimension });
}
