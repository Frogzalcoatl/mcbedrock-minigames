import {
	type Entity,
	EntityDamageCause,
	type ItemStack,
	type ItemUseAfterEvent,
	Player,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import { MinecraftEntityTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { beamFrom } from "../../../entities/beam";
import { killTrackerSetCombat } from "../../../entities/killTracker";
import { beamParticles } from "../../../particles/beam";
import { itemUseMap } from "../../events/itemUse";
import { isItemCooldownFinished, setItemCooldown } from "../../utils/cooldown";
import { defaultItemStackFunc } from "../../utils/default";

const typeId: string = MinecraftItemTypes.EndRod;
const nameTag: string = "§r§bLightning Stick§7 (Use)";
setItemCooldown(nameTag, typeId, 20 * 3);

export function itemLightningStick(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}

const lightningMap = new Map<string, string>(); // [lightningId, entityId]

function onHit(from: Entity, hitLocation: Vector3, _hitEntity?: Entity): void {
	beamParticles("minecraft:endrod", from.dimension, from.getHeadLocation(), hitLocation, 1);
	const lightning: Entity = from.dimension.spawnEntity(
		MinecraftEntityTypes.LightningBolt,
		hitLocation,
	);
	lightningMap.set(lightning.id, from.id);
	system.runTimeout(() => {
		lightningMap.delete(lightning.id);
	}, 3);
}

world.afterEvents.entityHurt.subscribe((event) => {
	if (
		event.damageSource.cause !== EntityDamageCause.lightning ||
		event.hurtEntity instanceof Player === false
	) {
		return;
	}
	const lightningArr: Entity[] | undefined = event.hurtEntity.dimension.getEntities({
		location: event.hurtEntity.location,
		maxDistance: 5,
		type: MinecraftEntityTypes.LightningBolt,
	});
	if (lightningArr === undefined) {
		return;
	}
	const lightning: Entity | undefined = lightningArr[0];
	if (lightning === undefined) {
		return;
	}
	const throwerId: string | undefined = lightningMap.get(lightning.id);
	if (throwerId === undefined) {
		return;
	}
	const thrower: Entity | undefined = world.getEntity(throwerId);
	if (thrower === undefined || !thrower.isValid || thrower.id === event.hurtEntity.id) {
		return;
	}
	killTrackerSetCombat(event.hurtEntity, thrower);
});

itemUseMap.set(nameTag, {
	callback: (event: ItemUseAfterEvent): void => {
		if (!isItemCooldownFinished(event.source, event.itemStack)) {
			return;
		}
		beamFrom(event.source, 128, onHit);
		event.source.dimension.playSound(
			"cauldron_drip.water.pointed_dripstone",
			event.source.location,
		);
	},
	typeId: typeId,
});
