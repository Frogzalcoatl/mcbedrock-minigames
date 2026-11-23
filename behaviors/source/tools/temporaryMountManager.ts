import {
	type Entity,
	EntityComponentTypes,
	type EntityLoadAfterEvent,
	type EntityRideableComponent,
	type EntityTameMountComponent,
	type Player,
	system,
	world,
} from "@minecraft/server";
import type { MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { EventSignal } from "./shared/eventSignal";

/*
Spawn mounts for a player to be removed after X ticks
If the world is closed while a player is on a temporary mount, the mount entity is removed when
world is restarted.
*/

const MOUNT_PROPERTY_ID: string = "frogzalcoatl:is_temporary_mount";

// fromCleanup === true when entity is removed after the world is closed and reopened.
export interface MountDespawnBeforeEvent {
	fromWorldRestart: boolean;
	mount: Entity;
	rider?: Player;
}

export class TemporaryMountManager {
	public readonly despawnBeforeEvent: EventSignal<MountDespawnBeforeEvent>;
	private _isInitialized: boolean;

	public constructor() {
		this.despawnBeforeEvent = new EventSignal();
		this._isInitialized = false;
	}

	private entityLoadCleanup = (event: EntityLoadAfterEvent): void => {
		if (
			event.entity.isValid &&
			event.entity.getDynamicProperty(MOUNT_PROPERTY_ID) !== undefined
		) {
			this.despawnBeforeEvent.triggerEvent({ fromWorldRestart: true, mount: event.entity });
			event.entity.remove();
		}
	};

	public init(): void {
		if (!this._isInitialized) {
			world.afterEvents.entityLoad.subscribe(this.entityLoadCleanup);
			this._isInitialized = true;
		}
	}

	public shutdown(): void {
		if (this._isInitialized) {
			world.afterEvents.entityLoad.unsubscribe(this.entityLoadCleanup);
			this._isInitialized = false;
		}
	}

	public spawn(
		mountType: MinecraftEntityTypes,
		player: Player,
		durationTicks: number,
		mountSpawnEvent = "minecraft:spawn_adult",
	): Entity | undefined {
		if (!this._isInitialized) {
			this.init();
		}
		const mountEntity: Entity = player.dimension.spawnEntity(mountType, player.location, {
			spawnEvent: mountSpawnEvent,
		});
		mountEntity.setDynamicProperty(MOUNT_PROPERTY_ID, true);
		const tameMount: EntityTameMountComponent | undefined = mountEntity.getComponent(
			EntityComponentTypes.TameMount,
		);
		if (tameMount === undefined) {
			mountEntity.remove();
			return undefined;
		}
		tameMount.tameToPlayer(false, player);
		const rideable: EntityRideableComponent | undefined = mountEntity.getComponent(
			EntityComponentTypes.Rideable,
		);
		if (rideable === undefined) {
			mountEntity.remove();
			return undefined;
		}
		rideable.addRider(player);
		let tickCount = 0;
		const intervalId: number = system.runInterval(() => {
			tickCount++;
			const isDismounted: boolean = !rideable.isValid || rideable.getRiders().length === 0;
			const isExpired: boolean = tickCount >= durationTicks;
			if (isDismounted || isExpired) {
				system.clearRun(intervalId);
				if (mountEntity.isValid) {
					const event: MountDespawnBeforeEvent = {
						fromWorldRestart: false,
						mount: mountEntity,
					};
					if (player.isValid) {
						event.rider = player;
					}
					this.despawnBeforeEvent.triggerEvent(event);
					if (mountEntity.isValid) {
						mountEntity.remove();
					}
				}
			}
		});
		return mountEntity;
	}
}
