import {
	EntityComponentTypes,
	type EntityHealthComponent,
	type EntityInventoryComponent,
	GameMode,
	type Player,
} from "@minecraft/server";
import { MinecraftDimensionTypes, MinecraftEffectTypes } from "@minecraft/vanilla-data";
import { MAX_EFFECT_DURATION, roomTypeIds } from "../../constants";
import { itemTeleporter } from "../../items/games/mainHub/teleporter";
import { clearEntityEffects, clearEntityInventory } from "../../tools/componentHelpers";
import { Room } from "../../tools/rooms/room";
import { type RoomCreatorFunc, roomTypeInit } from "../../tools/rooms/roomType";
import type { PlayerEvent } from "../../types";

const creator: RoomCreatorFunc = (dimensionId: string, displayName: string, icon: string): Room => {
	const room = new Room({
		dimensionId: dimensionId,
		displayName: displayName,
		icon: icon,
		includeHub: false,
		spawn: {
			facing: { x: 0.5, y: 0, z: -1 },
			pos: { x: 0.5, y: 0, z: 0.5 },
		},
		structures: [{ id: "ghostly/spawn", pos: { x: -55, y: -11, z: -59 } }],
	});
	room.onJoin.subscribe((event: PlayerEvent): void => {
		const player: Player = event.player;
		player.setGameMode(GameMode.Adventure);
		clearEntityInventory(player);
		const health: EntityHealthComponent | undefined = player.getComponent(
			EntityComponentTypes.Health,
		);
		if (health !== undefined) {
			health.resetToMaxValue();
		}
		clearEntityEffects(player);
		player.addEffect(MinecraftEffectTypes.Saturation, MAX_EFFECT_DURATION, {
			amplifier: 255,
			showParticles: false,
		});
		player.addEffect(MinecraftEffectTypes.Weakness, MAX_EFFECT_DURATION, {
			amplifier: 255,
			showParticles: false,
		});
		const inventory: EntityInventoryComponent | undefined = player.getComponent(
			EntityComponentTypes.Inventory,
		);
		if (inventory !== undefined) {
			inventory.container.setItem(4, itemTeleporter());
		}
	});
	return room;
};

roomTypeInit({
	defaultDimensionId: MinecraftDimensionTypes.Overworld,
	displayName: "Hub",
	icon: "textures/items/ender_eye.png",
	roomCount: 2,
	roomCreatorFunc: creator,
	typeId: roomTypeIds.hub,
});
