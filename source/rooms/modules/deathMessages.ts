import { type Entity, type EntityDieAfterEvent, Player, world } from "@minecraft/server";
import { playerRoomTracker } from "../roomManager";

export interface DeathMessageManager {
	roomIndex: number;
	formatDeath: (deadName: string, killerName: string | undefined) => string;
	entityDie: (event: EntityDieAfterEvent) => void;
}

function defaultFormatDeath(deadName: string, killerName: string | undefined): string {
	if (killerName === undefined) {
		return `${deadName} died`;
	} else {
		return `${killerName} killed ${deadName}`;
	}
}

export function getDeathMessageManager(
	roomIndex: number,
	formatDeath: (deadName: string, killerName: string | undefined) => string = defaultFormatDeath,
): DeathMessageManager {
	const manager: DeathMessageManager = {
		entityDie: (event: EntityDieAfterEvent) => {
			if (event.deadEntity instanceof Player === false) {
				return;
			}
			const message = manager.formatDeath(
				event.deadEntity.nameTag,
				event.damageSource.damagingEntity?.nameTag ??
					event.damageSource.damagingEntity?.typeId,
			);
			for (const [playerId, playerRoomIndex] of playerRoomTracker) {
				if (playerRoomIndex !== roomIndex) {
					continue;
				}
				const player: Entity | undefined = world.getEntity(playerId);
				if (player === undefined || player instanceof Player === false) {
					continue;
				}
				player.sendMessage(message);
			}
		},
		formatDeath: formatDeath,
		roomIndex: roomIndex,
	};
	return manager;
}
