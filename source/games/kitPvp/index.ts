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
import { MinecraftEffectTypes, MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { MAX_EFFECT_DURATION } from "../../constants";
import { deathMessageFromEvent, getEntityName } from "../../entities/deathMessages";
import { clearEntityEffects } from "../../entities/effects";
import { changeEntityHealth, setEntityHealth } from "../../entities/health";
import { clearEntityInventory } from "../../entities/inventory";
import {
	killTrackerGetCombatTimeTicks,
	killTrackerGetLastHitter,
	killTrackerRemovePlayer,
} from "../../entities/killTracker";
import { projectileTrackerRemoveProjectiles } from "../../entities/projectileTracker";
import { itemKitPvpSelect } from "../../items/kitPvpSelect";
import { itemTeleporter } from "../../items/teleporter";
import { kits } from "../../kits/kitManager";
import { Room, type RoomCreationFunc } from "../../rooms/room";
import roomTypeIds from "../../roomTypeIds";
import { getKitArcher } from "./kits/archer";
import { getKitBlaze } from "./kits/blaze";
import { getKitBreeze } from "./kits/breeze";
import { getKitFisherman } from "./kits/fisherman";
import { getKitLancer } from "./kits/lancer";
import { getKitPoseidon } from "./kits/poseidon";
import { getKitRabbit } from "./kits/rabbit";
import { getKitSnowman } from "./kits/snowman";

world.afterEvents.worldLoad.subscribe(() => {
	kits.set(roomTypeIds.kitPvp, [
		getKitBlaze(),
		getKitBreeze(),
		getKitSnowman(),
		getKitFisherman(),
		getKitPoseidon(),
		getKitRabbit(),
		getKitArcher(),
		getKitLancer(),
	]);
});

const healthAddedOnKill: number = 10;

export const getRoomKitPvp: RoomCreationFunc = (
	roomTypeIndex: number,
	roomIndex: number,
	dimensionId: string,
	displayName: string,
	icon: string,
): Room => {
	const room = new Room({
		dimensionId: dimensionId,
		displayName: displayName,
		hub: {
			onJoin: (player: Player): void => {
				killTrackerRemovePlayer(player);
				projectileTrackerRemoveProjectiles(player);
				player.setGameMode(GameMode.Adventure);
				setEntityHealth(player, "max");
				clearEntityInventory(player);
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
					inventory.container.setItem(3, itemKitPvpSelect());
					inventory.container.setItem(5, itemTeleporter());
				}
			},
		},
		icon: icon,
		killTracker: {
			onKill: (event: EntityDieAfterEvent): void => {
				const message: string | null = deathMessageFromEvent(event);
				if (message !== null) {
					room.sendMessage(message);
				}
				if (
					event.damageSource.damagingEntity instanceof Player &&
					event.damageSource.damagingEntity.isValid
				) {
					const killer: Player = event.damageSource.damagingEntity;
					system.run(() => changeEntityHealth(killer, healthAddedOnKill));
				}
			},
			showCombatTime: (player: Player): void => {
				const lastHitter: Entity | null = killTrackerGetLastHitter(player);
				if (lastHitter === null) {
					return;
				}
				const inCombatWith: string = getEntityName(lastHitter);
				const combatTimeSeconds: number = Math.ceil(
					killTrackerGetCombatTimeTicks(player) / 20,
				);
				const display: string = `In Combat: §e${inCombatWith} §7(${combatTimeSeconds})`;
				player.onScreenDisplay.setActionBar(display);
			},
		},
		projectileTracker: {
			typeIds: [MinecraftEntityTypes.ThrownTrident, MinecraftEntityTypes.SmallFireball],
		},
		roomIndex: roomIndex,
		roomTypeIndex: roomTypeIndex,
		spawn: { x: 0.5, y: 0, z: 0.5 },
		structures: [
			{ id: "ghostly/shopNoChests", pos: { x: -33, y: -3, z: -41 } },
			{ id: "ghostly/kitPvp", pos: { x: 128, y: 0, z: 128 } },
		],
	});
	return room;
};
