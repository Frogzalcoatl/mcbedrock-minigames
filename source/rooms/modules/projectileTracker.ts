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
	removePlayerProjectiles: (player: Player) => void;
}

export function getProjectileTracker(
	dimensionId: string,
	projectileTypeIds: string[],
): ProjectileTracker {
	const projectileMap = new Map<string, string>();
	function entityRemove(event: EntityRemoveAfterEvent): void {
		if (!projectileTypeIds.includes(event.typeId)) {
			return;
		}
		for (const [projectileId] of projectileMap) {
			if (event.removedEntityId === projectileId) {
				projectileMap.delete(projectileId);
				break;
			}
		}
	}
	function entitySpawn(event: EntitySpawnAfterEvent): void {
		if (
			!event.entity.isValid ||
			event.entity.dimension.id !== dimensionId ||
			!projectileTypeIds.includes(event.entity.typeId)
		) {
			return;
		}
		const projectile: EntityProjectileComponent | undefined = event.entity.getComponent(
			EntityComponentTypes.Projectile,
		);
		if (projectile?.owner && projectile.owner instanceof Player) {
			projectileMap.set(event.entity.id, projectile.owner.id);
		}
	}
	world.afterEvents.entityRemove.subscribe(entityRemove);
	world.afterEvents.entitySpawn.subscribe(entitySpawn);
	const tracker: ProjectileTracker = {
		removePlayerProjectiles: (player: Player): void => {
			for (const [projectileId, playerId] of projectileMap) {
				if (playerId === player.id) {
					const projectileEntity: Entity | undefined = world.getEntity(projectileId);
					if (projectileEntity?.isValid) {
						projectileEntity.remove();
					}
					projectileMap.delete(projectileId);
				}
			}
		},
	};
	return tracker;
}
