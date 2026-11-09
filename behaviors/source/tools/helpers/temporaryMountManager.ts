import {
	type Dimension,
	type Entity,
	EntityComponentTypes,
	type EntityLoadAfterEvent,
	type EntityRideableComponent,
	type EntityTameMountComponent,
	type Player,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import type { MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { spreadParticles } from "../shared/particles";

const MOUNT_PROPERTY_ID: string = "frogzalcoatl:is_temporary_mount";

function despawnEffects(pos: Vector3, dimension: Dimension): void {
	dimension.playSound("random.fizz", pos);
	spreadParticles("minecraft:dust_plume", dimension, pos, 1, 1, 20);
}

export class TemporaryMountManager {
	private _isInitialized: boolean;

	public constructor() {
		this._isInitialized = false;
	}

	private entityLoadCleanup = (event: EntityLoadAfterEvent): void => {
		if (
			event.entity.isValid &&
			event.entity.getDynamicProperty(MOUNT_PROPERTY_ID) !== undefined
		) {
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
	): Entity | undefined {
		if (!this._isInitialized) {
			this.init();
		}
		const mountEntity: Entity = player.dimension.spawnEntity(mountType, player.location, {
			spawnEvent: "minecraft:spawn_adult",
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
					despawnEffects(mountEntity.location, mountEntity.dimension);
					mountEntity.remove();
				}
			}
		});
		return mountEntity;
	}
}
