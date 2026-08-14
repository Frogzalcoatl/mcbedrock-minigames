import {
	type Dimension,
	type Entity,
	EntityComponentTypes,
	type EntityInventoryComponent,
	type EntityRideableComponent,
	type EntityTameMountComponent,
	ItemStack,
	type Player,
	system,
	type Vector3,
} from "@minecraft/server";
import { MinecraftEntityTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { spreadParticles } from "../particles/spread";

function despawnEffects(pos: Vector3, dimension: Dimension): void {
	dimension.playSound("random.fizz", pos);
	spreadParticles("minecraft:dust_plume", dimension, pos, 1, 1, 20);
}

// Returns horse entity
export function spawnHorseRide(
	horseType:
		| MinecraftEntityTypes.Horse
		| MinecraftEntityTypes.ZombieHorse
		| MinecraftEntityTypes.SkeletonHorse,
	player: Player,
	durationTicks: number,
	armorTypeId?: string,
): Entity | null {
	const horse: Entity = player.dimension.spawnEntity(horseType, player.location, {
		spawnEvent: "minecraft:spawn_adult",
	});
	const tameMount: EntityTameMountComponent | undefined = horse.getComponent(
		EntityComponentTypes.TameMount,
	);
	if (tameMount === undefined) {
		horse.remove();
		return null;
	}
	tameMount.tameToPlayer(false, player);
	const rideable: EntityRideableComponent | undefined = horse.getComponent(
		EntityComponentTypes.Rideable,
	);
	if (rideable === undefined) {
		horse.remove();
		return null;
	}
	rideable.addRider(player);
	system.runTimeout(() => {
		if (!horse.isValid) {
			return;
		}
		const inventory: EntityInventoryComponent | undefined = horse.getComponent(
			EntityComponentTypes.Inventory,
		);
		if (inventory === undefined) {
			return;
		}
		inventory.container.setItem(0, new ItemStack(MinecraftItemTypes.Saddle));
		if (armorTypeId !== undefined) {
			if (horseType === MinecraftEntityTypes.ZombieHorse) {
				horse.extinguishFire();
			}
			inventory.container.setItem(1, new ItemStack(armorTypeId));
		}
	}, 1);
	let tickCount: number = 0;
	const intervalId: number = system.runInterval(() => {
		tickCount++;
		if (!rideable.isValid || rideable.getRiders().length === 0) {
			if (horse.isValid) {
				despawnEffects(horse.location, horse.dimension);
				horse.remove();
			}
			system.clearRun(intervalId);
			return;
		}
		if (tickCount >= durationTicks) {
			system.clearRun(intervalId);
			return;
		}
	});
	system.runTimeout(() => {
		if (horse.isValid) {
			despawnEffects(horse.location, horse.dimension);
			horse.remove();
		}
	}, durationTicks);
	return horse;
}
