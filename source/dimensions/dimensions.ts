import {
	type Dimension,
	type Entity,
	EntityComponentTypes,
	type EntityInventoryComponent,
	Player,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import { MinecraftDimensionTypes, MinecraftEffectTypes } from "@minecraft/vanilla-data";
import { PACK_NAMESPACE } from "../constants";
import { clearEntityInventory } from "../entities/clearEntityInventory";
import { clearEntityEffects } from "../entities/effects";
import { killPlayerTridents as removePlayerTridents } from "../entities/tridentTracker";
import { KitItem } from "../items/hubItems";

export interface DimensionInfo {
	displayName: string;
	id: string;
	spawn: Vector3;
	joinCallback(entity: Entity): void;
	leaveCallback?(entity: Entity): void;
}

function teleportToDimension(entity: Entity, dimensionInfo: DimensionInfo): void {
	const dimension: Dimension | undefined = world.getDimension(dimensionInfo.id);
	if (dimension === undefined) {
		return;
	}
	entity.teleport(dimensionInfo.spawn, { dimension: dimension });
}

export const KITPVP_DIMENSION_ID: string = `${PACK_NAMESPACE}:kitpvp`;

const dimensions: DimensionInfo[] = [
	{
		displayName: "Hub",
		id: MinecraftDimensionTypes.Overworld,
		joinCallback(entity: Entity): void {
			clearEntityInventory(entity);
			clearEntityEffects(entity);
			entity.addEffect(MinecraftEffectTypes.Saturation, 2e7, {
				amplifier: 255,
				showParticles: false,
			});
			entity.addEffect(MinecraftEffectTypes.Weakness, 2e7, {
				amplifier: 255,
				showParticles: false,
			});
			const inventory: EntityInventoryComponent | undefined = entity.getComponent(
				EntityComponentTypes.Inventory,
			);
			if (inventory === undefined || !inventory.isValid || !inventory.container.isValid) {
				return;
			}
			if (KitItem !== undefined) {
				inventory.container.addItem(KitItem);
			}
			teleportToDimension(entity, this);
		},
		spawn: { x: 55.5, y: 11, z: 59.5 },
	},
	{
		displayName: "Kit Pvp",
		id: KITPVP_DIMENSION_ID,
		joinCallback(entity: Entity): void {
			clearEntityEffects(entity);
			entity.addEffect(MinecraftEffectTypes.Saturation, 2e7, {
				amplifier: 255,
				showParticles: false,
			});
			teleportToDimension(entity, this);
		},
		leaveCallback(entity: Entity): void {
			if (entity instanceof Player) {
				removePlayerTridents(entity);
			}
		},
		spawn: { x: 194.5, y: 9, z: 75.5 },
	},
];

system.beforeEvents.startup.subscribe((e) => {
	for (const d of dimensions) {
		if (d.id.startsWith("minecraft:")) {
			continue;
		}
		e.dimensionRegistry.registerCustomDimension(d.id);
	}
});

export async function showDimensionNavForm(player: Player): Promise<void> {
	if (!player.isValid) {
		return;
	}
	const form: ActionFormData = new ActionFormData();
	form.title("Dimension Navigation");
	for (const d of dimensions) {
		form.button(d.displayName);
	}
	const resp: ActionFormResponse = await form.show(player);
	if (resp.selection === undefined || !player.isValid) {
		return;
	}
	const dimensionInfo: DimensionInfo | undefined = dimensions[resp.selection];
	if (dimensionInfo === undefined) {
		return;
	}
	dimensionInfo.joinCallback(player);
}

export function entityDimensionTransfer(entity: Entity, dimensionId: string): void {
	if (!entity.isValid) {
		return;
	}
	const oldDimensionInfo: DimensionInfo | undefined = dimensions.find(
		(d) => d.id === entity.dimension.id,
	);
	if (oldDimensionInfo !== undefined && oldDimensionInfo.leaveCallback !== undefined) {
		oldDimensionInfo.leaveCallback(entity);
	}
	const newDimensionInfo: DimensionInfo | undefined = dimensions.find(
		(d) => d.id === dimensionId,
	);
	if (newDimensionInfo === undefined) {
		return;
	}
	newDimensionInfo.joinCallback(entity);
}
