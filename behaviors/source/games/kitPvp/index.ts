import {
	EntityComponentTypes,
	type EntityDieAfterEvent,
	type EntityInventoryComponent,
	GameMode,
	Player,
	system,
	world,
} from "@minecraft/server";
import { MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { PACK_NAMESPACE, roomTypeIds } from "../../constants";
import { itemCooldownRemovePlayer } from "../../items/cooldowns";
import { itemKitPvpSelect } from "../../items/games/kitPvp/kitPvpSelect";
import { itemTeleporter } from "../../items/games/mainHub/teleporter";
import { changeEntityHealth } from "../../tools/componentHelpers";
import { deathMessageFromEvent } from "../../tools/deathMessages";
import { kits } from "../../tools/games/kits";
import { LocalHub } from "../../tools/rooms/localHub";
import { Room } from "../../tools/rooms/room";
import { type RoomCreatorFunc, roomTypeInit } from "../../tools/rooms/roomType";
import {
	type KillTrackerConfig,
	killTrackerAddDimension,
	killTrackerRemovePlayer,
} from "../../tools/trackers/killTracker";
import {
	projectileTrackerAddDimension,
	projectileTrackerRemovePlayer,
} from "../../tools/trackers/projectileTracker";
import type { PlayerEvent } from "../../types";
import { hubEffectHelper } from "../helpers";
import { getKitBlaze } from "./kits/blaze";
import { getKitBreeze } from "./kits/breeze";
import { getKitFisherman } from "./kits/fisherman";
import { getKitLancer } from "./kits/lancer";
import { getKitPoseidon } from "./kits/poseidon";
import { getKitRabbit } from "./kits/rabbit";
import { getKitSkirmisher } from "./kits/skirmisher";
import { getKitSnowman } from "./kits/snowman";

world.afterEvents.worldLoad.subscribe(() => {
	kits.set(roomTypeIds.kitPvp, [
		getKitBlaze(),
		getKitBreeze(),
		getKitSnowman(),
		getKitFisherman(),
		getKitPoseidon(),
		getKitRabbit(),
		getKitSkirmisher(),
		getKitLancer(),
	]);
});

const healthAddedOnKill: number = 10;

const creator: RoomCreatorFunc = (dimensionId: string, displayName: string, icon: string): Room => {
	const room = new Room({
		dimensionId: dimensionId,
		displayName: displayName,
		icon: icon,
		spawn: {
			facing: { x: 0.5, y: 0, z: 1 },
			pos: { x: 0.5, y: 0, z: 0.5 },
		},
		structures: [
			{ id: "ghostly/shopNoChests", pos: { x: -33, y: -3, z: -41 } },
			{ id: "ghostly/kitPvp", pos: { x: 128, y: 0, z: 128 } },
		],
	});
	room.onLeave.subscribe((event) => {
		killTrackerRemovePlayer(event.player);
		itemCooldownRemovePlayer(event.player);
		projectileTrackerRemovePlayer(event.player.id, room.dimensionId);
	});
	room.localHub = new LocalHub(room.dimensionId, room.spawn);
	room.localHub.onJoin.subscribe((event: PlayerEvent): void => {
		killTrackerRemovePlayer(event.player);
		itemCooldownRemovePlayer(event.player);
		projectileTrackerRemovePlayer(event.player.id, room.dimensionId);
		event.player.setGameMode(GameMode.Adventure);
		hubEffectHelper(event.player);
		const inventory: EntityInventoryComponent | undefined = event.player.getComponent(
			EntityComponentTypes.Inventory,
		);
		if (inventory !== undefined) {
			inventory.container.setItem(3, itemKitPvpSelect());
			inventory.container.setItem(5, itemTeleporter());
		}
	});
	const killTracker: KillTrackerConfig = killTrackerAddDimension(room.dimensionId);
	killTracker.onKill.subscribe((event: EntityDieAfterEvent): void => {
		const message: string | null = deathMessageFromEvent(event);
		room.sendMessage(message);
		if (
			event.damageSource.damagingEntity instanceof Player &&
			event.damageSource.damagingEntity.isValid
		) {
			const killer: Player = event.damageSource.damagingEntity;
			system.run(() => changeEntityHealth(killer, healthAddedOnKill));
		}
	});
	projectileTrackerAddDimension(room.dimensionId, [
		MinecraftEntityTypes.ThrownTrident,
		MinecraftEntityTypes.SmallFireball,
	]);
	return room;
};

roomTypeInit({
	defaultDimensionId: `${PACK_NAMESPACE}:kitpvp`,
	displayName: "Kit Pvp",
	icon: "textures/items/blaze_powder.png",
	roomCount: 1,
	roomCreatorFunc: creator,
	typeId: roomTypeIds.kitPvp,
});
