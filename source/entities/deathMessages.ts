import {
	type Entity,
	type EntityDamageCause,
	type EntityDieAfterEvent,
	Player,
} from "@minecraft/server";

export function getEntityName(entity: Entity): string {
	return entity.nameTag ? entity.nameTag : entity instanceof Player ? entity.name : entity.typeId;
}

export function deathMessageFormat(
	deadName: string,
	killerName: string | null,
	_cause: EntityDamageCause | null,
	colorCode: string = "§f",
): string {
	if (killerName === null) {
		return `${colorCode}${deadName}§r${colorCode} died`;
	} else {
		return `${colorCode}${killerName}§r${colorCode} killed ${deadName}`;
	}
}

export function deathMessageFromEvent(
	event: EntityDieAfterEvent,
	colorCode: string = "§f",
): string | null {
	const deadName: string = getEntityName(event.deadEntity);
	let killerName: string | null = null;
	if (event.damageSource.damagingEntity?.isValid) {
		killerName = getEntityName(event.damageSource.damagingEntity);
	}
	return deathMessageFormat(deadName, killerName, event.damageSource.cause, colorCode);
}
