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
	dimensionId: string;
	projectileTypeIds: string[];
	projectileMap: Map<string, string>; // [projectileId, playerId]
	entitySpawnCallback: (event: EntitySpawnAfterEvent) => void;
	entityRemoveCallback: (event: EntityRemoveAfterEvent) => void;
	removePlayerProjectiles: (player: Player) => void;
}

export function getProjectileTracker(
	dimensionId: string,
	projectileTypeIds: string[],
): ProjectileTracker {
	const tracker: ProjectileTracker = {
		dimensionId: dimensionId,
		entityRemoveCallback: (event: EntityRemoveAfterEvent): void => {
			if (!tracker.projectileTypeIds.includes(event.typeId)) {
				return;
			}
			for (const [projectileId] of tracker.projectileMap) {
				if (event.removedEntityId === projectileId) {
					tracker.projectileMap.delete(projectileId);
					break;
				}
			}
		},
		entitySpawnCallback: (event: EntitySpawnAfterEvent): void => {
			if (
				event.entity.dimension.id !== tracker.dimensionId ||
				!tracker.projectileTypeIds.includes(event.entity.typeId)
			) {
				return;
			}
			const projectile: EntityProjectileComponent | undefined = event.entity.getComponent(
				EntityComponentTypes.Projectile,
			);
			if (projectile?.owner && projectile.owner instanceof Player) {
				tracker.projectileMap.set(event.entity.id, projectile.owner.id);
			}
		},
		projectileMap: new Map<string, string>(),
		projectileTypeIds: projectileTypeIds,
		removePlayerProjectiles: (player: Player): void => {
			for (const [projectileId, playerId] of tracker.projectileMap) {
				if (playerId === player.id) {
					const projectileEntity: Entity | undefined = world.getEntity(projectileId);
					if (projectileEntity?.isValid) {
						projectileEntity.remove();
					}
					tracker.projectileMap.delete(projectileId);
				}
			}
		},
	};
	return tracker;
}
