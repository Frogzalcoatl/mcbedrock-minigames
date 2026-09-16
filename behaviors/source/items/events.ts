import {
	type Entity,
	EntityComponentTypes,
	type EntityEquippableComponent,
	EquipmentSlot,
	type ItemCompleteUseAfterEvent,
	type ItemStack,
	type ItemUseAfterEvent,
	world,
} from "@minecraft/server";
import { MinecraftEffectTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";

world.afterEvents.itemCompleteUse.subscribe((event: ItemCompleteUseAfterEvent) => {
	// Limit gapple absorption level to match java
	if (event.itemStack.typeId === MinecraftItemTypes.GoldenApple) {
		event.source.removeEffect(MinecraftEffectTypes.Absorption);
		event.source.addEffect(MinecraftEffectTypes.Absorption, 20 * 120);
	}
});

world.afterEvents.entityHitEntity.subscribe((event) => {
	const equippable: EntityEquippableComponent | undefined = event.damagingEntity.getComponent(
		EntityComponentTypes.Equippable,
	);
	if (equippable === undefined) {
		return;
	}
	const mainhandItem: ItemStack | undefined = equippable.getEquipment(EquipmentSlot.Mainhand);
	if (mainhandItem === undefined || mainhandItem.nameTag === undefined) {
		return;
	}
	const value: ItemEntityHitValue | undefined = itemEntityHitMap.get(mainhandItem.nameTag);
	if (value !== undefined && value.typeId === mainhandItem.typeId) {
		value.callback(mainhandItem, event.damagingEntity, event.hitEntity);
	}
});

world.afterEvents.itemUse.subscribe(itemUseHandler);

export interface ItemEntityHitValue {
	callback: (mainhandItem: ItemStack, damagingEntity: Entity, hitEntity: Entity) => void;
	typeId: string;
}

export const itemEntityHitMap = new Map<string, ItemEntityHitValue>();

export interface ItemUseValue {
	callback: (event: ItemUseAfterEvent) => void;
	typeId: string;
}

export const itemUseMap = new Map<string, ItemUseValue>(); // [nameTag, value]

export function itemUseHandler(event: ItemUseAfterEvent): void {
	if (event.itemStack.nameTag === undefined) {
		return;
	}
	const value: ItemUseValue | undefined = itemUseMap.get(event.itemStack.nameTag);
	if (value !== undefined && value.typeId === event.itemStack.typeId) {
		value.callback(event);
	}
}
