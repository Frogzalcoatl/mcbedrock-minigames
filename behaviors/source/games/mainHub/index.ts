import {
	EntityComponentTypes,
	type EntityInventoryComponent,
	GameMode,
	PlayerPermissionLevel,
} from "@minecraft/server";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
import { itemSettings } from "../../items/settings";
import { itemTeleporter } from "../../items/teleporter";
import { roomTypeIds } from "../../tools/constants";
import { clearEntityEquippable, hubEffectHelper } from "../../tools/helpers/entityComponents";
import { Room, type RoomTransferEvent } from "../../tools/room/room";
import { type RoomCreatorFunc, RoomType } from "../../tools/room/roomType";
import { QueueMode } from "../../tools/types";

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
	room.onJoin.subscribe((event: RoomTransferEvent): void => {
		event.player.setGameMode(GameMode.Adventure);
		hubEffectHelper(event.player);
		clearEntityEquippable(event.player);
		const inventory: EntityInventoryComponent | undefined = event.player.getComponent(
			EntityComponentTypes.Inventory,
		);
		if (inventory !== undefined) {
			inventory.container.clearAll();
			inventory.container.setItem(4, itemTeleporter());
			if (event.player.playerPermissionLevel === PlayerPermissionLevel.Operator) {
				inventory.container.setItem(0, itemSettings());
			}
		}
	});
	return room;
};

new RoomType({
	defaultDimensionId: MinecraftDimensionTypes.Overworld,
	displayName: "Hub",
	icon: "textures/items/ender_eye.png",
	queueMode: QueueMode.InOrder,
	roomCount: 2,
	roomCreatorFunc: creator,
	typeId: roomTypeIds.hub,
});
