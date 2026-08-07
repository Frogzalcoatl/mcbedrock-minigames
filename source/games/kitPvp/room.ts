import {
	EntityComponentTypes,
	type EntityInventoryComponent,
	GameMode,
	type Player,
} from "@minecraft/server";
import { MinecraftEffectTypes, MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { MAX_EFFECT_DURATION } from "../../constants";
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
	return new Room({
		blockInteraction: {
			afterEvent: undefined,
			beforeEvent: "default",
		},
		deathMessages: "default",
		dimensionId: dimensionId,
		displayName: displayName,
		icon: icon,
		onJoin: (player: Player): void => {
			player.setGameMode(GameMode.Adventure);
			setEntityHealth(player, "max");
			clearEntityInventory(player);
			clearEntityEffects(player);
			player.addEffect(MinecraftEffectTypes.Saturation, MAX_EFFECT_DURATION, {
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
		projectileTrackerTypeIds: [MinecraftEntityTypes.ThrownTrident],
		roomIndex: roomIndex,
		roomTypeIndex: roomTypeIndex,
		spawn: { x: 0.5, y: 0, z: 0.5 },
		structures: [
			{ id: "ghostlyMangroveNoChests", pos: { x: -33, y: -3, z: -41 } },
			{ id: "kitPvpArena", pos: { x: 128, y: 0, z: 128 } },
		],
	});
}
