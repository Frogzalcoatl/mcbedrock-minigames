import { type Entity, GameMode, Player } from "@minecraft/server";
import { MinecraftEffectTypes, MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { MAX_EFFECT_DURATION } from "../../constants";
import { clearEntityEffects } from "../../entities/effects";
import { setEntityHealth } from "../../entities/health";
import { getDeathMessageManager } from "../modules/deathMessages";
import { getProjectileTracker } from "../modules/projectileTracker";
import { Room } from "../room";

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
		projectileTracker: getProjectileTracker(dimensionId, [MinecraftEntityTypes.ThrownTrident]),
		roomIndex: roomIndex,
		spawn: { x: 194.5, y: 9, z: 75.5 },
		structures: [{ id: "kitPvpArena", pos: { x: 0, y: 0, z: 0 } }],
	});
}
