import {
	type Entity,
	EntityComponentTypes,
	type EntityDieAfterEvent,
	type EntityInventoryComponent,
	GameMode,
	type Player,
} from "@minecraft/server";
import { MinecraftEffectTypes, MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { MAX_EFFECT_DURATION } from "../../constants";
import { deathMessageFromEvent, getEntityName } from "../../entities/deathMessages";
import { clearEntityEffects } from "../../entities/effects";
import { setEntityHealth } from "../../entities/health";
import { clearEntityInventory } from "../../entities/inventory";
import { itemKitPvpSelect } from "../../items/kitPvpSelect";
import { itemTeleporter } from "../../items/teleporter";
import { Room } from "../../rooms/room";

export function getRoomKitPvp(
	roomTypeIndex: number,
	roomIndex: number,
	dimensionId: string,
	displayName: string,
	icon: string,
): Room {
	const room = new Room({
		blockInteraction: {
			afterEvent: undefined,
			beforeEvent: "default",
		},
		dimensionId: dimensionId,
		displayName: displayName,
		hub: {
			onJoin: (player: Player): void => {
				if (room.killTracker !== null) {
					if (room.killTracker.inCombat(player)) {
						room.killTracker.simulatedDeath(player);
					}
					room.killTracker.removePlayer(player);
				}
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
				if (inventory === undefined || !inventory.isValid || !inventory.container.isValid) {
					return;
				}
				inventory.container.setItem(3, itemKitPvpSelect());
				inventory.container.setItem(5, itemTeleporter());
			},
		},
		icon: icon,
		killTracker: {
			cooldownTicks: 7 * 20,
			includeMobKills: false,
			onKill: (event: EntityDieAfterEvent): void => {
				const message: string | null = deathMessageFromEvent(event);
				if (message !== null) {
					room.sendMessage(message);
				}
			},
			showCombatTimeCallback: (player: Player): void => {
				if (room.killTracker === null) {
					return;
				}
				const lastHitter: Entity | null = room.killTracker.getLastHitter(player);
				if (lastHitter === null) {
					return;
				}
				const inCombatWith: string = getEntityName(lastHitter);
				const combatTimeSeconds: number = Math.ceil(
					room.killTracker.getCombatTimeTicks(player) / 20,
				);
				const display: string = `In Combat: §e${inCombatWith} §7(${combatTimeSeconds})`;
				player.onScreenDisplay.setActionBar(display);
			},
		},
		projectileTrackerTypeIds: [MinecraftEntityTypes.ThrownTrident],
		roomIndex: roomIndex,
		roomTypeIndex: roomTypeIndex,
		spawn: { x: 0.5, y: 0, z: 0.5 },
		structures: [
			{ id: "ghostlyMangroveNoChests", pos: { x: -33, y: -3, z: -41 } },
			{ id: "kitPvpArena", pos: { x: 128, y: 0, z: 128 } },
		],
	});
	return room;
}
