import { type Entity, type EntityDieAfterEvent, Player, world } from "@minecraft/server";
import { playerRoomTracker } from "../roomManager";

export type DeathMessageFunc = ((event: EntityDieAfterEvent) => string | null) | "default";

function defaultFormatDeathMessage(event: EntityDieAfterEvent): string | null {
	if (!event.deadEntity.isValid || event.deadEntity instanceof Player === false) {
		return null;
	}
	const deadPlayer: Player = event.deadEntity;
	if (
		event.damageSource.damagingEntity === undefined ||
		!event.damageSource.damagingEntity.isValid
	) {
		return `${deadPlayer.name} died`;
	} else {
		const killer: Entity = event.damageSource.damagingEntity;
		const killerName: string = killer instanceof Player ? killer.name : killer.typeId;
		return `${killerName} killed ${deadPlayer.name}`;
	}
}

export function initDeathMessages(
	roomTypeIndex: number,
	roomIndex: number,
	deathMessageFunc: DeathMessageFunc,
): void {
	const formatDeathMessage =
		deathMessageFunc === "default" ? defaultFormatDeathMessage : deathMessageFunc;
	function entityDie(event: EntityDieAfterEvent): void {
		const message: string | null = formatDeathMessage(event);
		if (message === null) {
			return;
		}
		for (const [playerId, [playerRoomTypeIndex, playerRoomIndex]] of playerRoomTracker) {
			if (playerRoomTypeIndex !== roomTypeIndex || playerRoomIndex !== roomIndex) {
				continue;
			}
			const player: Entity | undefined = world.getEntity(playerId);
			if (player === undefined || player instanceof Player === false) {
				continue;
			}
			player.sendMessage(message);
		}
	}
	world.afterEvents.entityDie.subscribe(entityDie);
}
