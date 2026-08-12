import {
	EntityComponentTypes,
	type EntityRidingComponent,
	type ItemStack,
	type ItemUseAfterEvent,
	type Vector3,
	type VectorXZ,
} from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { isItemCooldownFinished } from "./utils/cooldown";
import { defaultItemStackFunc } from "./utils/default";
import { itemNameMatches } from "./utils/matches";

const typeId: string = MinecraftItemTypes.Feather;
const nameTag: string = "§rLancer Leap §7(Use)";
export const itemLancerLeapCooldownTicks: number = 20 * 3;
const horizontalLeapStrength: number = 4;
const verticalLeapStrength: number = 0.5;

export function itemLancerLeap(): ItemStack {
	return defaultItemStackFunc(typeId, nameTag);
}

export function itemLancerLeapRun(event: ItemUseAfterEvent): void {
	if (
		itemNameMatches(event.itemStack, typeId, nameTag) &&
		isItemCooldownFinished(event.source, event.itemStack)
	) {
		const viewDirection: Vector3 = event.source.getViewDirection();
		const knockbackXz: VectorXZ = {
			x: viewDirection.x * horizontalLeapStrength,
			z: viewDirection.z * horizontalLeapStrength,
		};
		const riding: EntityRidingComponent | undefined = event.source.getComponent(
			EntityComponentTypes.Riding,
		);
		if (riding !== undefined) {
			riding.entityRidingOn.applyKnockback(knockbackXz, verticalLeapStrength);
		} else {
			event.source.applyKnockback(knockbackXz, verticalLeapStrength);
		}
	}
}
