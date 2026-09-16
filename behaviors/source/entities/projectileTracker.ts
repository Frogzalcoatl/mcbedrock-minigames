import {
	type Dimension,
	type Entity,
	EntityComponentTypes,
	type EntityLoadAfterEvent,
	type EntityProjectileComponent,
	type EntityRemoveBeforeEvent,
	type EntitySpawnAfterEvent,
	Player,
	type PlayerLeaveAfterEvent,
	world,
} from "@minecraft/server";
import { dimensionTracker } from "../player/dimensionTracker";

interface ProjectileTracker {
	map: Map<string, string>; // [projectileId, playerId]
	projectileTypeIds: string[];
}

const trackers = new Map<string, ProjectileTracker>(); // key is dimensionId

const trackedPojectilePropertyId: string = "tracked_projectile";

world.beforeEvents.entityRemove.subscribe((event: EntityRemoveBeforeEvent) => {
	const tracker: ProjectileTracker | undefined = trackers.get(event.removedEntity.dimension.id);
	if (tracker === undefined) {
		return;
	}
	if (tracker.map.delete(event.removedEntity.id)) {
	}
});

world.afterEvents.entitySpawn.subscribe((event: EntitySpawnAfterEvent) => {
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
});
world.afterEvents.entityLoad.subscribe((event: EntityLoadAfterEvent) => {
	if (
		event.entity.isValid &&
		event.entity.getDynamicProperty(trackedPojectilePropertyId) !== undefined
	) {
		event.entity.remove();
	}
});

world.afterEvents.playerLeave.subscribe((event: PlayerLeaveAfterEvent) => {
	const dimension: Dimension | null = dimensionTracker(event.playerId);
	if (dimension !== null) {
		projectileTrackerRemovePlayer(event.playerId, dimension.id);
	}
});

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

export function projectileTrackerRemovePlayer(playerId: string, dimensionId: string): void {
	const tracker: ProjectileTracker | undefined = trackers.get(dimensionId);
	if (tracker === undefined) {
		return;
	}
	for (const [projectileId, currentPlayerId] of tracker.map) {
		if (playerId === currentPlayerId) {
			const projectileEntity: Entity | undefined = world.getEntity(projectileId);
			if (projectileEntity?.isValid) {
				projectileEntity.remove();
			}
			tracker.map.delete(projectileId);
		}
	}
}
