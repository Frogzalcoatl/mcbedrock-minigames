import { type Entity, type EntityDieAfterEvent, Player, world } from "@minecraft/server";
import { getEntityKit, type Kit } from "./kitManager";

function handleDeath(event: EntityDieAfterEvent): void {
	if (!event.deadEntity.isValid) {
		return;
	}
	const kit: Kit | null = getEntityKit(event.deadEntity);
	if (kit === null) {
		return;
	}
	if (kit.onDeath !== undefined && event.deadEntity instanceof Player) {
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
	const kit: Kit | null = getEntityKit(killerEntity);
	if (
		kit !== null &&
		kit.onKill !== undefined &&
		event.damageSource.damagingEntity instanceof Player
	) {
		kit.onKill(event.damageSource.damagingEntity, event.deadEntity);
	}
}

world.afterEvents.entityDie.subscribe((e) => {
	handleDeath(e);
	handleKill(e);
});
