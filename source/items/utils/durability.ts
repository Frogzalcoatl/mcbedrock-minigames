import {
	ItemComponentTypes,
	type ItemDurabilityComponent,
	type ItemStack,
} from "@minecraft/server";

export function setDurability(item: ItemStack, value: number | "unbreakable" | "max"): void {
	const durabilityComponent: ItemDurabilityComponent | undefined = item.getComponent(
		ItemComponentTypes.Durability,
	);
	if (durabilityComponent === undefined) {
		return;
	}
	if (value === "unbreakable") {
		durabilityComponent.unbreakable = true;
		return;
	}
	durabilityComponent.unbreakable = false;
	if (value === "max" || value > durabilityComponent.maxDurability) {
		durabilityComponent.damage = 0;
		return;
	}
	if (value < 0) {
		return;
	}
	durabilityComponent.unbreakable = false;
	durabilityComponent.damage = durabilityComponent.maxDurability - value;
}
