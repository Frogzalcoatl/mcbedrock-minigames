import {
	type Entity,
	EntityComponentTypes,
	type EntityInventoryComponent,
	GameMode,
	Player,
	system,
} from "@minecraft/server";
import {
	MinecraftDimensionTypes,
	MinecraftEffectTypes,
	MinecraftEntityTypes,
} from "@minecraft/vanilla-data";
import { clearEntityInventory } from "../entities/clearEntityInventory";
import { clearEntityEffects } from "../entities/effects";
import { setEntityHealth } from "../entities/health";
import { getProjectileTracker } from "../entities/projectileTracker";
import { KitItem } from "../items/hubItems";
import { KITPVP_DIMENSION_ID } from "./dimensionIds";
import { Room } from "./room";

export const rooms: Room[] = [];

export const playerRoomTracker = new Map<string, number>(); // [playerId, roomIndex]

system.beforeEvents.startup.subscribe((e) => {
	rooms.push(
		new Room({
			dimensionId: MinecraftDimensionTypes.Overworld,
			displayName: "Hub",
			onJoin: (entity: Entity): void => {
				if (entity instanceof Player) {
					entity.setGameMode(GameMode.Adventure);
				}
				clearEntityInventory(entity);
				clearEntityEffects(entity);
				setEntityHealth(entity, "max");
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
			},
			roomIndex: 0,
			spawn: { x: 55.5, y: 11, z: 59.5 },
		}),
	);
	rooms.push(
		new Room({
			dimensionId: KITPVP_DIMENSION_ID,
			displayName: "Kit Pvp",
			onJoin: (entity: Entity) => {
				if (entity instanceof Player) {
					entity.setGameMode(GameMode.Adventure);
				}
				clearEntityEffects(entity);
				setEntityHealth(entity, "max");
				entity.addEffect(MinecraftEffectTypes.Saturation, 2e7, {
					amplifier: 255,
					showParticles: false,
				});
			},
			projectileTracker: getProjectileTracker(KITPVP_DIMENSION_ID, [
				MinecraftEntityTypes.ThrownTrident,
			]),
			roomIndex: 1,
			spawn: { x: 194.5, y: 9, z: 75.5 },
		}),
	);
	for (const room of rooms) {
		room.registerDimension(e.dimensionRegistry);
	}
});

export function joinRoom(entity: Entity, dimensionId: string): void {
	for (const room of rooms) {
		if (room.dimensionId === dimensionId) {
			room.join(entity);
			return;
		}
	}
}
