import {
	ItemComponentTypes,
	type ItemDurabilityComponent,
	type ItemStack,
} from "@minecraft/server";

export function setDurability(item: ItemStack, value: number | "unbreakable"): void {
	const durabilityComponent: ItemDurabilityComponent | undefined = item.getComponent(
		ItemComponentTypes.Durability,
	);
	if (durabilityComponent === undefined || !durabilityComponent.isValid) {
		return;
	}
	if (value === "unbreakable") {
		durabilityComponent.unbreakable = true;
		return;
	}
	if (value > durabilityComponent.maxDurability || value < 0) {
		return;
	}
	durabilityComponent.damage = durabilityComponent.maxDurability - value;
}
