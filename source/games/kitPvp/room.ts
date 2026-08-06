import { type Entity, GameMode, Player } from "@minecraft/server";
import { MinecraftEffectTypes, MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { MAX_EFFECT_DURATION } from "../../constants";
import { clearEntityEffects } from "../../entities/effects";
import { setEntityHealth } from "../../entities/health";
import { KITPVP_DIMENSION_ID } from "../../rooms/dimensionIds";
import { getDeathMessageManager } from "../../rooms/modules/deathMessages";
import { getProjectileTracker } from "../../rooms/modules/projectileTracker";
import { Room } from "../../rooms/room";

export function getRoomKitPvp(
	roomIndex: number,
	dimensionId: string,
	displayName: string = "Kit Pvp",
): Room {
	return new Room({
		deathMessages: getDeathMessageManager(roomIndex),
		dimensionId: dimensionId,
		displayName: displayName,
		onJoin: (entity: Entity): void => {
			if (entity instanceof Player) {
				entity.setGameMode(GameMode.Adventure);
			}
			clearEntityEffects(entity);
			setEntityHealth(entity, "max");
			entity.addEffect(MinecraftEffectTypes.Saturation, MAX_EFFECT_DURATION, {
				amplifier: 255,
				showParticles: false,
			});
		},
		projectileTracker: getProjectileTracker(KITPVP_DIMENSION_ID, [
			MinecraftEntityTypes.ThrownTrident,
		]),
		roomIndex: roomIndex,
		spawn: { x: 194.5, y: 9, z: 75.5 },
	});
}
