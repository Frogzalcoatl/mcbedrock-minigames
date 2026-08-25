import {
	type Entity,
	EntityComponentTypes,
	type EntityLoadAfterEvent,
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

const trackers = new Map<string, ProjectileTracker>(); // key is dimensionId

export function projectileTrackerAddDimension(
	dimensionId: string,
	projectileTypeIds: string[],
): void {
	trackers.set(dimensionId, {
		map: new Map<string, string>(),
		projectileTypeIds: projectileTypeIds,
	});
}

export function projectileTrackerRemoveDimension(dimensionId: string): boolean {
	return trackers.delete(dimensionId);
}

export function projectileTrackerHasDimension(dimensionId: string): boolean {
	return trackers.has(dimensionId);
}

export function projectileTrackerClearDimensions(): void {
	trackers.clear();
}

const trackedPojectilePropertyId: string = "mg:tracked_projectile";

// Removes player's projectiles from their current dimension
export function projectileTrackerRemoveProjectiles(player: Player): void {
	const tracker: ProjectileTracker | undefined = trackers.get(player.dimension.id);
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
	const tracker: ProjectileTracker | undefined = trackers.get(event.removedEntity.dimension.id);
	if (tracker === undefined) {
		return;
	}
	if (tracker.map.delete(event.removedEntity.id)) {
	}
}

function entitySpawn(event: EntitySpawnAfterEvent): void {
	if (!event.entity.isValid) {
		return;
	}
	const tracker: ProjectileTracker | undefined = trackers.get(event.entity.dimension.id);
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
		event.entity.setDynamicProperty(trackedPojectilePropertyId, true);
	}
}

function entityLoad(event: EntityLoadAfterEvent): void {
	if (event.entity.getDynamicProperty(trackedPojectilePropertyId) !== undefined) {
		event.entity.remove();
	}
}

world.beforeEvents.entityRemove.subscribe(entityRemove);
world.afterEvents.entitySpawn.subscribe(entitySpawn);
world.afterEvents.entityLoad.subscribe(entityLoad);
