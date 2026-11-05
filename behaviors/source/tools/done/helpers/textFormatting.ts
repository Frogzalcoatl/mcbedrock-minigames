import { type Entity, type EntityDamageCause, Player } from "@minecraft/server";
import { DEFAULT_CHATNAME_PREFIX } from "../../constants";

export function playerDisplayName(player: Player): string {
	if (!player.isValid) {
		return `${DEFAULT_CHATNAME_PREFIX}${player.name}`;
	}
	return `${player.chatNamePrefix ?? DEFAULT_CHATNAME_PREFIX}${player.name}${player.chatNameSuffix ?? ""}`;
}

export function entityDisplayName(entity: Entity): string {
	if (entity instanceof Player) {
		return playerDisplayName(entity);
	} else {
		return entity.nameTag ? entity.nameTag : entity.typeId;
	}
}

export function formatTimeSeconds(seconds: number): string {
	const hours: number = Math.floor(seconds / 3600);
	const remainingMinutes: number = Math.floor(seconds / 60) % 60;
	const remainingSeconds: number = seconds % 60;
	let output = "";
	if (hours > 0) {
		output += `${hours < 10 ? "0" : ""}${hours}:`;
	}
	if (remainingMinutes > 0 || hours > 0) {
		output += `${remainingMinutes < 10 ? "0" : ""}${remainingMinutes}:`;
	}
	output += `${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
	return output;
}

// Will eventually use EntityDamageCause to return unique death messages
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
