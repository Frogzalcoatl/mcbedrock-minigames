import { EntityComponentTypes, type EntityInventoryComponent, GameMode } from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
import { roomTypeIds } from "../../constants";
import { itemTeleporter } from "../../items/games/mainHub/teleporter";
import { Room } from "../../tools/room/room";
import { type RoomCreatorFunc, roomTypeInit } from "../../tools/room/roomType";
import type { PlayerEvent } from "../../types";
import { hubEffectHelper } from "../helpers";

const creator: RoomCreatorFunc = (dimensionId: string, displayName: string, icon: string): Room => {
	const room = new Room({
		dimensionId: dimensionId,
		displayName: displayName,
		icon: icon,
		spawn: {
			facing: { x: 0.5, y: 0, z: -1 },
			pos: { x: 0.5, y: 0, z: 0.5 },
		},
		structures: [{ id: "ghostly/spawn", pos: { x: -55, y: -11, z: -59 } }],
	});
	room.onJoin.subscribe((event: PlayerEvent): void => {
		event.player.setGameMode(GameMode.Adventure);
		hubEffectHelper(event.player);
		const inventory: EntityInventoryComponent | undefined = event.player.getComponent(
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
