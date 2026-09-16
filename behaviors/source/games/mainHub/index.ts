import {
	EntityComponentTypes,
	type EntityHealthComponent,
	type EntityInventoryComponent,
	GameMode,
	type Player,
} from "@minecraft/server";
import { MinecraftEffectTypes } from "@minecraft/vanilla-data";
import { MAX_EFFECT_DURATION } from "../../constants";
import { clearEntityEffects, clearEntityInventory } from "../../entities/componentUtils";
import { itemTeleporter } from "../../items/games/mainHub/teleporter";
import { Room } from "../../rooms/room";
import type { RoomCreationFunc } from "../../rooms/roomType";
import type { PlayerEvent } from "../../types";

export const getRoomHub: RoomCreationFunc = (
	roomTypeIndex: number,
	roomIndex: number,
	dimensionId: string,
	displayName: string,
	icon: string,
): Room => {
	const room = new Room({
		dimensionId: dimensionId,
		displayName: displayName,
		icon: icon,
		includeHub: false,
		roomIndex: roomIndex,
		roomTypeIndex: roomTypeIndex,
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
