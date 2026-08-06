import { type Entity, type EntityDieAfterEvent, world } from "@minecraft/server";
import { getEntityKit, type Kit } from "./kitManager";

function handleDeath(event: EntityDieAfterEvent): void {
	if (!event.deadEntity.isValid) {
		return;
	}
	const kit: Kit | null = getEntityKit(event.deadEntity);
	if (kit === null) {
		return;
	}
	if (kit.onDeath !== undefined) {
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
	const killerEntity: Entity = event.damageSource.damagingEntity;
	if (!killerEntity.isValid) {
		return;
	}
	const kit: Kit | null = getEntityKit(killerEntity);
	if (
		kit !== null &&
		kit.onKill !== undefined &&
		event.damageSource.damagingEntity !== undefined
	) {
		kit.onKill(event.damageSource.damagingEntity, event.deadEntity);
	}
}

world.afterEvents.entityDie.subscribe((e) => {
	handleDeath(e);
	handleKill(e);
});
