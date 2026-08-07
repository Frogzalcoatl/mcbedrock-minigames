import { type Entity, type EntityDieAfterEvent, Player, world } from "@minecraft/server";
import { playerRoomTracker } from "../roomManager";

export interface DeathMessageManager {
	roomTypeIndex: number;
	roomIndex: number;
	formatDeath: (deadName: string, killerName: string | undefined) => string;
	entityDie: (event: EntityDieAfterEvent) => void;
	init: () => void;
}

function defaultFormatDeath(deadName: string, killerName: string | undefined): string {
	if (killerName === undefined) {
		return `${deadName} died`;
	} else {
		return `${killerName} killed ${deadName}`;
	}
}

export function getDeathMessageManager(
	roomTypeIndex: number,
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
			for (const [playerId, [playerRoomTypeIndex, playerRoomIndex]] of playerRoomTracker) {
				if (
					playerRoomTypeIndex !== manager.roomTypeIndex ||
					playerRoomIndex !== manager.roomIndex
				) {
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
		init: (): void => {
			world.afterEvents.entityDie.subscribe(manager.entityDie);
		},
		roomIndex: roomIndex,
		roomTypeIndex: roomTypeIndex,
	};
	return manager;
}
