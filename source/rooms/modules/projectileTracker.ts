import {
	type Entity,
	EntityComponentTypes,
	type EntityProjectileComponent,
	type EntityRemoveAfterEvent,
	type EntitySpawnAfterEvent,
	Player,
	world,
} from "@minecraft/server";

export interface ProjectileTracker {
	readonly dimensionId: string;
	projectileTypeIds: string[];
	map: Map<string, string>; // [projectileId, playerId]
	readonly removePlayerProjectiles: (player: Player) => void;
}

export function getProjectileTracker(
	dimensionId: string,
	projectileTypeIds: string[],
): ProjectileTracker {
	const tracker: ProjectileTracker = {
		dimensionId: dimensionId,
		map: new Map<string, string>(),
		projectileTypeIds: projectileTypeIds,
		removePlayerProjectiles: (player: Player): void => {
			for (const [projectileId, playerId] of tracker.map) {
				if (playerId === player.id) {
					const projectileEntity: Entity | undefined = world.getEntity(projectileId);
					if (projectileEntity?.isValid) {
						projectileEntity.remove();
					}
					tracker.map.delete(projectileId);
				}
			}
		},
	};
	function entityRemove(event: EntityRemoveAfterEvent): void {
		if (!tracker.projectileTypeIds.includes(event.typeId)) {
			return;
		}
		for (const [projectileId] of tracker.map) {
			if (event.removedEntityId === projectileId) {
				tracker.map.delete(projectileId);
				break;
			}
		}
	}
	function entitySpawn(event: EntitySpawnAfterEvent): void {
		if (
			!event.entity.isValid ||
			event.entity.dimension.id !== tracker.dimensionId ||
			!tracker.projectileTypeIds.includes(event.entity.typeId)
		) {
			return;
		}
		const projectile: EntityProjectileComponent | undefined = event.entity.getComponent(
			EntityComponentTypes.Projectile,
		);
		if (projectile?.owner && projectile.owner instanceof Player) {
			tracker.map.set(event.entity.id, projectile.owner.id);
		}
	}
	world.afterEvents.entityRemove.subscribe(entityRemove);
	world.afterEvents.entitySpawn.subscribe(entitySpawn);
	return tracker;
}
