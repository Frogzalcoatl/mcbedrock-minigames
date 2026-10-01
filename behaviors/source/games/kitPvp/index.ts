import {
	type Entity,
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
import { itemKitPvpSelect } from "../../items/games/kitPvp/kitPvpSelect";
import { itemTeleporter } from "../../items/games/mainHub/teleporter";
import { tools } from "../../tools";
import type { Kit } from "../../tools/game/kits";
import {
	changeEntityHealth,
	clearEntityEquippable,
	hubEffectHelper,
} from "../../tools/misc/componentHelpers";
import { deathMessageFromEvent } from "../../tools/misc/textFormatting";
import { LocalHub, type LocalHubTransferEvent } from "../../tools/room/localHub";
import { Room, type RoomTransferEvent } from "../../tools/room/room";
import { type RoomCreatorFunc, RoomType } from "../../tools/room/roomType";
import type { KillTrackerSettings } from "../../tools/trackers";
import { getKitBlaze } from "./kits/blaze";
import { getKitBreeze } from "./kits/breeze";
import { getKitFisherman } from "./kits/fisherman";
import { getKitLancer } from "./kits/lancer";
import { getKitPoseidon } from "./kits/poseidon";
import { getKitRabbit } from "./kits/rabbit";
import { getKitSkirmisher } from "./kits/skirmisher";
import { getKitSnowman } from "./kits/snowman";

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
	room.onLeave.subscribe((event: RoomTransferEvent) => {
		tools.killTracker.removePlayer(event.player);
		tools.itemCooldowns.removePlayer(event.player);
		tools.projectileTracker.removePlayer(event.player);
		tools.kitManager.reset(event.player);
	});
	room.localHub = new LocalHub(room.dimensionId, room.spawn);
	room.localHub.onJoin.subscribe((event: LocalHubTransferEvent): void => {
		tools.killTracker.removePlayer(event.player);
		tools.itemCooldowns.removePlayer(event.player);
		tools.projectileTracker.removePlayer(event.player);
		tools.kitManager.reset(event.player);
		hubEffectHelper(event.player);
		event.player.setGameMode(GameMode.Adventure);
		clearEntityEquippable(event.player);
		const inventory: EntityInventoryComponent | undefined = event.player.getComponent(
			EntityComponentTypes.Inventory,
		);
		if (inventory !== undefined) {
			inventory.container.clearAll();
			inventory.container.setItem(3, itemKitPvpSelect());
			inventory.container.setItem(5, itemTeleporter());
		}
	});
	const killTracker: KillTrackerSettings = tools.killTracker.addDimension(room.dimensionId);
	killTracker.onKill.subscribe((event: EntityDieAfterEvent): void => {
		room.sendMessage(deathMessageFromEvent(event));
		if (event.damageSource.damagingEntity?.isValid) {
			const killer: Entity = event.damageSource.damagingEntity;
			system.run(() => changeEntityHealth(killer, healthAddedOnKill));
		}
		if (event.deadEntity instanceof Player && event.deadEntity.isValid) {
			const dead: Player = event.deadEntity;
			system.runTimeout(() => {
				room.localHub?.join(dead);
			}, 1);
		}
	});
	tools.projectileTracker.addDimension(room.dimensionId, [
		MinecraftEntityTypes.ThrownTrident,
		MinecraftEntityTypes.SmallFireball,
	]);
	return room;
};

new RoomType({
	defaultDimensionId: `${PACK_NAMESPACE}:kitpvp`,
	displayName: "Kit Pvp",
	icon: "textures/items/blaze_powder.png",
	roomCount: 1,
	roomCreatorFunc: creator,
	typeId: roomTypeIds.kitPvp,
});

world.afterEvents.worldLoad.subscribe(() => {
	kitPvpKits.push(
		getKitBlaze(),
		getKitBreeze(),
		getKitSnowman(),
		getKitFisherman(),
		getKitPoseidon(),
		getKitRabbit(),
		getKitSkirmisher(),
		getKitLancer(),
	);
});

export const kitPvpKits: Kit[] = [];
