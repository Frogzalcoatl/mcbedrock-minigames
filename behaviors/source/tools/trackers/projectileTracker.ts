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
	World,
	world,
} from "@minecraft/server";
import { minigames } from "..";
import { dimensionTracker } from "./dimensionTracker";

export class ProjectileTracker {
	private readonly _dimensions: Map<Dimension, string[]>; // values are projectileTypeIds
	private readonly _projectiles: Map<string, string>; // [projectileId, playerId]
	private readonly propertyId: string;

	public constructor() {
		this._dimensions = new Map<Dimension, string[]>();
		this._projectiles = new Map<string, string>();
		this.propertyId = "tracked_projectile";
	}

	public removePlayer(playerId: string): void {
		for (const [projectileId, currentPlayerId] of this._projectiles) {
			if (playerId !== currentPlayerId) {
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
		const projectileTypeIds: string[] | undefined = this._dimensions.get(event.entity.dimension);
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
		if (
			event.entity.isValid &&
			event.entity.getDynamicProperty(this.propertyId) !== undefined
		) {
			event.entity.remove();
		}
	}

	private playerLeave = (event: PlayerLeaveAfterEvent): void => {
		this.removePlayer(event.playerId);
	}

	public init(): void {
		world.beforeEvents.entityRemove.subscribe(this.entityRemove);
		world.afterEvents.entitySpawn.subscribe(this.entitySpawn);
		world.afterEvents.entityLoad.subscribe(this.entityLoad);
		world.afterEvents.playerLeave.subscribe(this.playerLeave);
	}

	public shutdown(): void {
		world.beforeEvents.entityRemove.unsubscribe(this.entityRemove);
		world.afterEvents.entitySpawn.unsubscribe(this.entitySpawn);
		world.afterEvents.entityLoad.unsubscribe(this.entityLoad);
		world.afterEvents.playerLeave.unsubscribe(this.playerLeave);
	}
}
