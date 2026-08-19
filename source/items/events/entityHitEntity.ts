import {
	type Entity,
	EntityComponentTypes,
	type EntityEquippableComponent,
	EquipmentSlot,
	type ItemStack,
	world,
} from "@minecraft/server";

export interface ItemEntityHitEntry {
	typeId: string;
	callback: (mainhandItem: ItemStack, damagingEntity: Entity, hitEntity: Entity) => void;
}

export const itemEntityHitMap = new Map<string, ItemEntityHitEntry>();

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
	const entry: ItemEntityHitEntry | undefined = itemEntityHitMap.get(mainhandItem.nameTag);
	if (entry !== undefined && entry.typeId === mainhandItem.typeId) {
		entry.callback(mainhandItem, event.damagingEntity, event.hitEntity);
	}
});
