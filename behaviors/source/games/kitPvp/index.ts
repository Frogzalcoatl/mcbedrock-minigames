import {
	type Entity,
	EntityComponentTypes,
	type EntityDieAfterEvent,
	type EntityInventoryComponent,
	GameMode,
	type Player,
	PlayerPermissionLevel,
	system,
	world,
} from "@minecraft/server";
import { MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { itemKitPvpSelect } from "../../items/kitPvp/kitPvpSelect";
import { itemSettings } from "../../items/settings";
import { itemTeleporter } from "../../items/teleporter";
import { tools } from "../../tools";
import { PACK_NAMESPACE, roomTypeIds } from "../../tools/constants";
import {
	changeEntityHealth,
	clearEntityEquippable,
	hubEffectHelper,
} from "../../tools/helpers/entityComponents";
import { deathMessageFromEvent } from "../../tools/helpers/textFormatting";
import type { Kit } from "../../tools/managers/kits";
import type { KillTrackerSettings } from "../../tools/managers/trackers";
import { LocalHub, type LocalHubTransferEvent } from "../../tools/room/localHub";
import { Room, type RoomTransferEvent } from "../../tools/room/room";
import { type RoomCreatorFunc, RoomType } from "../../tools/room/roomType";
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
		tools.items.cooldowns.removePlayer(event.player);
		tools.projectileTracker.removePlayer(event.player);
		tools.kitManager.reset(event.player);
	});
	room.localHub = new LocalHub(room, room.spawn);
	room.localHub.onJoin.subscribe((event: LocalHubTransferEvent): void => {
		tools.killTracker.removePlayer(event.player);
		tools.items.cooldowns.removePlayer(event.player);
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
			if (event.player.playerPermissionLevel === PlayerPermissionLevel.Operator) {
				inventory.container.setItem(0, itemSettings());
			}
		}
	});
	const killTracker: KillTrackerSettings = tools.killTracker.addDimension(room.dimensionId);
	killTracker.onKill.subscribe((event: EntityDieAfterEvent): void => {
		room.sendMessage(deathMessageFromEvent(event));
		if (event.damageSource.damagingEntity?.isValid) {
			const killer: Entity = event.damageSource.damagingEntity;
			system.run(() => changeEntityHealth(killer, healthAddedOnKill));
		}
	});
	killTracker.onRespawn.subscribe((player: Player) => {
		room.localHub?.join(player);
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
