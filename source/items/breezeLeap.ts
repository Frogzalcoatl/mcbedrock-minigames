import type { ItemStack, ItemUseAfterEvent } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { isItemCooldownFinished } from "./utils/cooldown";
import { defaultItemStackFunc } from "./utils/default";
import { itemNameMatches } from "./utils/matches";

const typeId: string = MinecraftItemTypes.BreezeRod;
const nameTag: string = "§r§bBreeze Leap §7(Use)";
export const itemBreezeLeapCooldownTicks: number = 20 * 5;
const horizontalLeapStrength: number = 3;
const verticalLeapStrength: number = 0.5;

export function itemBreezeLeap(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}

export function itemBreezeLeapRun(event: ItemUseAfterEvent): void {
	if (
		itemNameMatches(event.itemStack, typeId, nameTag) &&
		isItemCooldownFinished(event.source, event.itemStack)
	) {
		const viewDirection = event.source.getViewDirection();
		event.source.applyKnockback(
			{
				x: viewDirection.x * horizontalLeapStrength,
				z: viewDirection.z * horizontalLeapStrength,
			},
			verticalLeapStrength,
		);
		event.source.dimension.spawnParticle(
			"minecraft:wind_explosion_emitter",
			event.source.location,
		);
		event.source.dimension.playSound("mob.breeze.jump", event.source.location);
	}
}
