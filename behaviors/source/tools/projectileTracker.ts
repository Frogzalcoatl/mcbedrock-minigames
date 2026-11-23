import {
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

/*
Maps projectile entities to player ids to remove them when the player disconnects, or at will by
the caller.
*/

const TRACKED_PROPERTY_ID: string = "frogzalcoatl:tracked_projectile";

export class ProjectileTracker {
	public readonly projectileTypeIds: Set<string>; // entity type ids
	private readonly _trackedPlayerIds: Set<string>;
	private readonly _projectiles: Map<string, string>; // [projectileId, playerId]
	private _isInitialized: boolean;

	public constructor(projectileTypeIds: string[]) {
		this._trackedPlayerIds = new Set();
		this.projectileTypeIds = new Set(projectileTypeIds);
		this._projectiles = new Map<string, string>();
		this._isInitialized = false;
	}

	public trackPlayer(playerId: string): void {
		this._trackedPlayerIds.add(playerId);
	}

	public untrackPlayer(playerId: string): void {
		this._trackedPlayerIds.delete(playerId);
	}

	public removePlayerProjectiles(playerId: string): number {
		let removed = 0;
		for (const [projectileId, ownerId] of this._projectiles) {
			if (ownerId !== playerId) {
				continue;
			}
			this._projectiles.delete(projectileId);
			const entity: Entity | undefined = world.getEntity(projectileId);
			if (entity?.isValid) {
				entity.remove();
				removed++;
			}
		}
		return removed;
	}

	public removeTrackedProjectiles(): number {
		let removed = 0;
		for (const [projectileId] of this._projectiles) {
			const entity: Entity | undefined = world.getEntity(projectileId);
			if (entity?.isValid) {
				entity.remove();
				removed++;
			}
		}
		this._projectiles.clear();
		return removed;
	}

	private entityRemove = (event: EntityRemoveBeforeEvent): void => {
		this._projectiles.delete(event.removedEntity.id);
	};

	private entitySpawn = (event: EntitySpawnAfterEvent): void => {
		if (!(event.entity.isValid && this.projectileTypeIds.has(event.entity.typeId))) {
			return;
		}
		const projectileComponent: EntityProjectileComponent | undefined = event.entity.getComponent(
			EntityComponentTypes.Projectile,
		);
		if (
			projectileComponent?.owner instanceof Player &&
			this._trackedPlayerIds.has(projectileComponent.owner.id)
		) {
			this._projectiles.set(event.entity.id, projectileComponent.owner.id);
			event.entity.setDynamicProperty(TRACKED_PROPERTY_ID, true);
		}
	};

	private entityLoad = (event: EntityLoadAfterEvent): void => {
		if (
			event.entity.isValid &&
			this.projectileTypeIds.has(event.entity.typeId) &&
			event.entity.getDynamicProperty(TRACKED_PROPERTY_ID) !== undefined
		) {
			event.entity.remove();
		}
	};

	private playerLeave = (event: PlayerLeaveAfterEvent): void => {
		this.untrackPlayer(event.playerId);
		this.removePlayerProjectiles(event.playerId);
	};

	public init(): void {
		if (!this._isInitialized) {
			world.beforeEvents.entityRemove.subscribe(this.entityRemove);
			world.afterEvents.entitySpawn.subscribe(this.entitySpawn);
			world.afterEvents.entityLoad.subscribe(this.entityLoad);
			world.afterEvents.playerLeave.subscribe(this.playerLeave);
			this._isInitialized = true;
		}
	}

	public shutdown(): void {
		if (this._isInitialized) {
			world.beforeEvents.entityRemove.unsubscribe(this.entityRemove);
			world.afterEvents.entitySpawn.unsubscribe(this.entitySpawn);
			world.afterEvents.entityLoad.unsubscribe(this.entityLoad);
			world.afterEvents.playerLeave.unsubscribe(this.playerLeave);
			this._projectiles.clear();
			this._trackedPlayerIds.clear();
			this._isInitialized = false;
		}
	}
}
