import {
	type Entity,
	EntityComponentTypes,
	type EntityProjectileComponent,
	type EntityRemoveBeforeEvent,
	type EntitySpawnAfterEvent,
	Player,
	world,
} from "@minecraft/server";

export interface ProjectileTrackerConfig {
	typeIds: string[];
}

export interface ProjectileTracker {
	map: Map<string, string>; // [projectileId, playerId]
	projectileTypeIds: string[];
}

export const projectileTrackerDimensionIds = new Map<string, ProjectileTracker>();

export function projectileTrackerInit(dimensionId: string, projectileTypeIds: string[]): void {
	projectileTrackerDimensionIds.set(dimensionId, {
		map: new Map<string, string>(),
		projectileTypeIds: projectileTypeIds,
	});
}

// Removes player's projectiles from their current dimension
export function projectileTrackerRemoveProjectiles(player: Player): void {
	const tracker: ProjectileTracker | undefined = projectileTrackerDimensionIds.get(
		player.dimension.id,
	);
	if (tracker === undefined) {
		return;
	}
	for (const [projectileId, playerId] of tracker.map) {
		if (playerId === player.id) {
			const projectileEntity: Entity | undefined = world.getEntity(projectileId);
			if (projectileEntity?.isValid) {
				projectileEntity.remove();
			}
			tracker.map.delete(projectileId);
		}
	}
}

function entityRemove(event: EntityRemoveBeforeEvent): void {
	const tracker: ProjectileTracker | undefined = projectileTrackerDimensionIds.get(
		event.removedEntity.dimension.id,
	);
	if (tracker === undefined) {
		return;
	}
	tracker.map.delete(event.removedEntity.id);
}

function entitySpawn(event: EntitySpawnAfterEvent): void {
	const tracker: ProjectileTracker | undefined = projectileTrackerDimensionIds.get(
		event.entity.dimension.id,
	);
	if (tracker === undefined) {
		return;
	}
	if (!tracker.projectileTypeIds.includes(event.entity.typeId)) {
		return;
	}
	const projectile: EntityProjectileComponent | undefined = event.entity.getComponent(
		EntityComponentTypes.Projectile,
	);
	if (projectile?.owner && projectile.owner instanceof Player) {
		tracker.map.set(event.entity.id, projectile.owner.id);
	}
}

world.beforeEvents.entityRemove.subscribe(entityRemove);
world.afterEvents.entitySpawn.subscribe(entitySpawn);
