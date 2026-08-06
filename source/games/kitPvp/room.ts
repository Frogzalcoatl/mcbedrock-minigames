import { GameMode, type Player } from "@minecraft/server";
import { MinecraftEffectTypes, MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { MAX_EFFECT_DURATION } from "../../constants";
import { clearEntityEffects } from "../../entities/effects";
import { setEntityHealth } from "../../entities/health";
import { clearEntityInventory } from "../../entities/inventory";
import { giveKit } from "../../kits/kitManager";
import { getDeathMessageManager } from "../../rooms/modules/deathMessages";
import { getProjectileTracker } from "../../rooms/modules/projectileTracker";
import { Room } from "../../rooms/room";
import { showKitsForm } from "./ui";

export function getRoomKitPvp(
	roomTypeIndex: number,
	roomIndex: number,
	dimensionId: string,
	displayName: string,
	icon: string,
): Room {
	return new Room({
		beforeJoin: async (player: Player): Promise<boolean> => {
			const kitIndex: number | undefined = await showKitsForm(player);
			if (kitIndex === undefined) {
				return Promise.resolve(false);
			}
			player.setGameMode(GameMode.Adventure);
			clearEntityEffects(player);
			clearEntityInventory(player);
			setEntityHealth(player, "max");
			player.addEffect(MinecraftEffectTypes.Saturation, MAX_EFFECT_DURATION, {
				amplifier: 255,
				showParticles: false,
			});
			giveKit(player, kitIndex);
			return Promise.resolve(true);
		},
		deathMessages: getDeathMessageManager(roomIndex),
		dimensionId: dimensionId,
		displayName: displayName,
		icon: icon,
		projectileTracker: getProjectileTracker(dimensionId, [MinecraftEntityTypes.ThrownTrident]),
		roomIndex: roomIndex,
		roomTypeIndex: roomTypeIndex,
		spawn: { x: 194.5, y: 9, z: 75.5 },
		structures: [{ id: "kitPvpArena", pos: { x: 0, y: 0, z: 0 } }],
	});
}
