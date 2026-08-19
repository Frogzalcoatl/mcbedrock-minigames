import type { Entity, ItemStack, ItemUseAfterEvent, Vector3 } from "@minecraft/server";
import { MinecraftEntityTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { beamFrom } from "../../../entities/beam";
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

function onHit(from: Entity, hitLocation: Vector3, _hitEntity?: Entity): void {
	from.dimension.spawnEntity(MinecraftEntityTypes.LightningBolt, hitLocation);
	beamParticles("minecraft:endrod", from.dimension, from.getHeadLocation(), hitLocation, 1);
}

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
