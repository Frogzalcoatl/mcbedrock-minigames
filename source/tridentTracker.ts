import {
	type Entity,
	EntityComponentTypes,
	type EntityProjectileComponent,
	type Player,
	world,
} from "@minecraft/server";
import { MinecraftEntityTypes } from "@minecraft/vanilla-data";

const tridentTracker = new Map<string, string>(); // [tridentId, playerId]

world.afterEvents.entitySpawn.subscribe((e) => {
	if (e.entity.typeId !== MinecraftEntityTypes.ThrownTrident) {
		return;
	}
	const projectile: EntityProjectileComponent | undefined = e.entity.getComponent(
		EntityComponentTypes.Projectile,
	);
	if (projectile === undefined || projectile.owner === undefined) {
		return;
	}
	tridentTracker.set(e.entity.id, projectile.owner.id);
});

world.afterEvents.entityRemove.subscribe((e) => {
	if (e.typeId !== MinecraftEntityTypes.ThrownTrident) {
		return;
	}
	for (const [tridentId] of tridentTracker) {
		if (e.removedEntityId === tridentId) {
			tridentTracker.delete(tridentId);
			break;
		}
	}
});

export function killPlayerTridents(player: Player): void {
	for (const [tridentId, playerId] of tridentTracker) {
		if (playerId === player.id) {
			const tridentEntity: Entity | undefined = world.getEntity(tridentId);
			if (tridentEntity === undefined || !tridentEntity.isValid) {
				return;
			}
			tridentEntity.remove();
			tridentTracker.delete(tridentId);
		}
	}
}
