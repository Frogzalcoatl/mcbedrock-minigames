import type { ItemLockMode } from "@minecraft/server";
import { setDurability } from "../items/utils/durability";
import { applyEnchant } from "../items/utils/enchant";
import type { Kit } from "./kitManager";

export function kitArmorEnchant(kit: Kit, id: string, level: number = 1): void {
	if (kit.helmet) {
		applyEnchant(kit.helmet, id, level);
	}
	if (kit.chestplate) {
		applyEnchant(kit.chestplate, id, level);
	}
	if (kit.leggings) {
		applyEnchant(kit.leggings, id, level);
	}
	if (kit.boots) {
		applyEnchant(kit.boots, id, level);
	}
}

export function kitArmorDurability(kit: Kit, value: number | "unbreakable"): void {
	if (kit.helmet) {
		setDurability(kit.helmet, value);
	}
	if (kit.chestplate) {
		setDurability(kit.chestplate, value);
	}
	if (kit.leggings) {
		setDurability(kit.leggings, value);
	}
	if (kit.boots) {
		setDurability(kit.boots, value);
	}
}

export function kitArmorLockMode(kit: Kit, mode: ItemLockMode): void {
	if (kit.helmet) {
		kit.helmet.lockMode = mode;
	}
	if (kit.chestplate) {
		kit.chestplate.lockMode = mode;
	}
	if (kit.leggings) {
		kit.leggings.lockMode = mode;
	}
	if (kit.boots) {
		kit.boots.lockMode = mode;
	}
}

export function kitInventoryLockMode(kit: Kit, mode: ItemLockMode): void {
	for (const entry of kit.inventory) {
		entry.item.lockMode = mode;
	}
}
