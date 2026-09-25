import {
	type Entity,
	type EntityDamageCause,
	type EntityDieAfterEvent,
	Player,
} from "@minecraft/server";
import { DEFAULT_CHATNAME_PREFIX } from "../constants";
import { playerNameTracker } from "./trackers/playerNameTracker";

export function getPlayerName(player: Player): string {
	if (!player.isValid) {
		return `§7${playerNameTracker(player.id)}`;
	}
	return `${player.chatNamePrefix ?? DEFAULT_CHATNAME_PREFIX}${player.name}${player.chatNameSuffix ?? ""}`;
}

export function getEntityName(entity: Entity): string {
	if (entity instanceof Player) {
		return getPlayerName(entity);
	} else {
		return entity.nameTag ? entity.nameTag : entity.typeId;
	}
}

export function formatTimeSeconds(seconds: number): string {
	const minutes: number = Math.floor(seconds / 60);
	const remainingSeconds: number = seconds % 60;
	return `${minutes < 10 ? "0" : ""}${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

export function deathMessageFormat(
	deadName: string,
	killerName: string | null,
	_cause: EntityDamageCause | null,
	colorCode = "§7",
): string {
	if (killerName === null) {
		return `${colorCode}${deadName}§r${colorCode} died`;
	} else {
		return `${colorCode}${killerName}§r${colorCode} killed ${deadName}`;
	}
}

export function deathMessageFromEvent(event: EntityDieAfterEvent, colorCode = "§7"): string {
	const deadName: string = getEntityName(event.deadEntity);
	let killerName: string | null = null;
	if (event.damageSource.damagingEntity?.isValid) {
		killerName = getEntityName(event.damageSource.damagingEntity);
	}
	return deathMessageFormat(deadName, killerName, event.damageSource.cause, colorCode);
}
