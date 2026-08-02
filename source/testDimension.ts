import {
	type Dimension,
	ItemLockMode,
	ItemStack,
	type Player,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import { MinecraftDimensionTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { PACK_NAMESPACE } from "./constants";

const TEST_DIMENSION_ID: string = `${PACK_NAMESPACE}:test`;

system.beforeEvents.startup.subscribe((e) => {
	e.dimensionRegistry.registerCustomDimension(TEST_DIMENSION_ID);
});

export let NavItem: ItemStack;
system.run(() => {
	NavItem = new ItemStack(MinecraftItemTypes.Compass);
	NavItem.nameTag = "§r§dDimension Navigation§r";
	NavItem.lockMode = ItemLockMode.inventory;
});

interface DimensionSpawn {
	id: string;
	location: Vector3;
}
const DimensionSpawns: DimensionSpawn[] = [
	{ id: MinecraftDimensionTypes.Overworld, location: { x: 0.5, y: -50, z: 0.5 } },
	{ id: MinecraftDimensionTypes.Nether, location: { x: 0.5, y: 50, z: 0.5 } },
	{ id: MinecraftDimensionTypes.TheEnd, location: { x: 0.5, y: 100.5, z: 0.5 } },
	{ id: TEST_DIMENSION_ID, location: { x: 0.5, y: 0, z: 0.5 } },
];

export async function showDimensionNavForm(player: Player): Promise<void> {
	if (!player.isValid) {
		return;
	}
	const form: ActionFormData = new ActionFormData().title("Dimension Navigation");
	for (const d of DimensionSpawns) {
		form.button(d.id);
	}
	const resp: ActionFormResponse = await form.show(player);
	if (
		resp.canceled ||
		resp.selection === undefined ||
		resp.selection >= DimensionSpawns.length ||
		!player.isValid
	) {
		return;
	}
	const dimensionSpawn: DimensionSpawn | undefined = DimensionSpawns[resp.selection];
	if (dimensionSpawn === undefined) {
		return;
	}
	let dimension: Dimension | undefined;
	try {
		dimension = world.getDimension(dimensionSpawn.id);
	} catch (error) {
		if (error instanceof Error) {
			player.sendMessage(
				`§cUnable to navigate to dimension "${dimensionSpawn.id}": ${error.message}`,
			);
		}
	}
	if (dimension === undefined) {
		return;
	}
	player.teleport(dimensionSpawn.location, { dimension: dimension });
}

world.afterEvents.itemUse.subscribe((e) => {
	if (e.itemStack.typeId === NavItem.typeId && e.itemStack.nameTag === NavItem.nameTag) {
		showDimensionNavForm(e.source);
	}
});
