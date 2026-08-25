import type { EntityDieAfterEvent } from "@minecraft/server";
import { getEntityKit, type Kit } from "./kitManager";

function handleDeath(event: EntityDieAfterEvent): void {
	if (!event.deadEntity.isValid) {
		return;
	}
	const kit: Kit | null = getEntityKit(event.deadEntity);
	if (kit?.onDeath) {
		kit.onDeath(event.deadEntity, event.damageSource.damagingEntity);
	}
}

function handleKill(event: EntityDieAfterEvent): void {
	if (
		event.damageSource.damagingEntity === undefined ||
		!event.damageSource.damagingEntity.isValid
	) {
		return;
	}
	const kit: Kit | null = getEntityKit(event.damageSource.damagingEntity);
	if (kit?.onKill) {
		kit.onKill(event.damageSource.damagingEntity, event.deadEntity);
	}
}

export function kitsEntityDieHandler(event: EntityDieAfterEvent): void {
	handleDeath(event);
	handleKill(event);
}
