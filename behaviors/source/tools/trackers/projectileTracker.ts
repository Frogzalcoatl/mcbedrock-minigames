import {
	type Entity,
	EntityComponentTypes,
	type EntityLoadAfterEvent,
	type EntityProjectileComponent,
	type EntityRemoveBeforeEvent,
	type EntitySpawnAfterEvent,
	Player,
	type PlayerLeaveBeforeEvent,
	world,
} from "@minecraft/server";

export class ProjectileTracker {
	public readonly dimensions: Map<string, string[]>; // values are projectileTypeIds
	private readonly _projectiles: Map<string, string>; // [projectileId, playerId]
	private readonly propertyId: string;

	public constructor() {
		this.dimensions = new Map<string, string[]>();
		this._projectiles = new Map<string, string>();
		this.propertyId = "tracked_projectile";
	}

	public addDimension(dimensionId: string, projectileTypeIds: string[]): void {
		this.dimensions.set(dimensionId, projectileTypeIds);
	}

	public removePlayer(player: Player): void {
		for (const [projectileId, currentPlayerId] of this._projectiles) {
			if (player.id !== currentPlayerId) {
				continue;
			}
			const entity: Entity | undefined = world.getEntity(projectileId);
			if (entity?.isValid) {
				entity.remove();
			}
		}
	}

	private entityRemove = (event: EntityRemoveBeforeEvent): void => {
		this._projectiles.delete(event.removedEntity.id);
	};

	private entitySpawn = (event: EntitySpawnAfterEvent): void => {
		if (!event.entity.isValid) {
			return;
		}
		const projectileTypeIds: string[] | undefined = this.dimensions.get(
			event.entity.dimension.id,
		);
		if (projectileTypeIds === undefined) {
			return;
		}
		const projectileComponent: EntityProjectileComponent | undefined = event.entity.getComponent(
			EntityComponentTypes.Projectile,
		);
		if (projectileComponent?.owner && projectileComponent.owner instanceof Player) {
			this._projectiles.set(event.entity.id, projectileComponent.owner.id);
		}
	};

	private entityLoad = (event: EntityLoadAfterEvent): void => {
		if (event.entity.isValid && event.entity.getDynamicProperty(this.propertyId) !== undefined) {
			event.entity.remove();
		}
	};

	private playerLeave = (event: PlayerLeaveBeforeEvent): void => {
		this.removePlayer(event.player);
	};

	public init(): void {
		world.beforeEvents.entityRemove.subscribe(this.entityRemove);
		world.afterEvents.entitySpawn.subscribe(this.entitySpawn);
		world.afterEvents.entityLoad.subscribe(this.entityLoad);
		world.beforeEvents.playerLeave.subscribe(this.playerLeave);
	}

	public shutdown(): void {
		world.beforeEvents.entityRemove.unsubscribe(this.entityRemove);
		world.afterEvents.entitySpawn.unsubscribe(this.entitySpawn);
		world.afterEvents.entityLoad.unsubscribe(this.entityLoad);
		world.beforeEvents.playerLeave.unsubscribe(this.playerLeave);
	}
}
