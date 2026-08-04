import { type Dimension, type Player, type Vector3, world } from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
import { KITPVP_DIMENSION_ID, TEST_DIMENSION_ID } from "./dimensions";

interface DimensionSpawn {
	id: string;
	location: Vector3;
}

const DimensionSpawns: DimensionSpawn[] = [
	{ id: MinecraftDimensionTypes.Overworld, location: { x: 0.5, y: -50, z: 0.5 } },
	{ id: MinecraftDimensionTypes.Nether, location: { x: 0.5, y: 50, z: 0.5 } },
	{ id: MinecraftDimensionTypes.TheEnd, location: { x: 0.5, y: 100.5, z: 0.5 } },
	{ id: TEST_DIMENSION_ID, location: { x: 0.5, y: 0, z: 0.5 } },
	{ id: KITPVP_DIMENSION_ID, location: { x: 194.5, y: 8, z: 75.5 } },
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
