import {
	type Entity,
	EntityComponentTypes,
	type EntityInventoryComponent,
	GameMode,
	Player,
	system,
} from "@minecraft/server";
import { MinecraftDimensionTypes, MinecraftEffectTypes } from "@minecraft/vanilla-data";
import { clearEntityInventory } from "../entities/clearEntityInventory";
import { clearEntityEffects } from "../entities/effects";
import { setEntityHealth } from "../entities/health";
import { removePlayerTridents } from "../entities/tridentTracker";
import { KitItem } from "../items/hubItems";
import { KITPVP_DIMENSION_ID } from "./dimensionIds";
import { Room } from "./room";

export const gameRooms: Room[] = [];

export const playerRoomTracker = new Map<string, number>(); // [playerId, roomIndex]

system.beforeEvents.startup.subscribe((e) => {
	gameRooms.push(
		new Room(
			MinecraftDimensionTypes.Overworld,
			0,
			"Hub",
			{ x: 55.5, y: 11, z: 59.5 },
			(entity: Entity): void => {
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
		),
	);
	gameRooms.push(
		new Room(
			KITPVP_DIMENSION_ID,
			1,
			"Kit Pvp",
			{ x: 194.5, y: 9, z: 75.5 },
			(entity: Entity) => {
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
			(entity: Entity) => {
				if (entity instanceof Player) {
					removePlayerTridents(entity);
				}
			},
		),
	);
	for (const room of gameRooms) {
		room.registerDimension(e.dimensionRegistry);
	}
});

export function joinRoom(entity: Entity, dimensionId: string): void {
	for (const room of gameRooms) {
		if (room.dimensionId === dimensionId) {
			room.join(entity);
			return;
		}
	}
}
