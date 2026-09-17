import {
	type Container,
	type Entity,
	EntityComponentTypes,
	type EntityDieAfterEvent,
	type EntityEquippableComponent,
	type EntityInventoryComponent,
	EquipmentSlot,
	type ItemLockMode,
	type ItemStack,
} from "@minecraft/server";
import { applyEnchant, setDurability } from "../componentHelpers";

function giveKitInventory(kitInventory: KitInventory, container: Container): void {
	for (const entry of kitInventory) {
		if (container.size <= entry.slot || entry.slot < 0) {
			continue;
		}
		container.setItem(entry.slot, entry.item);
	}
}

function giveKitEquipment(kit: Kit, equippable: EntityEquippableComponent): void {
	// if a kit equipment slot is undefined, the slot is simply cleared.
	equippable.setEquipment(EquipmentSlot.Head, kit.helmet);
	equippable.setEquipment(EquipmentSlot.Chest, kit.chestplate);
	equippable.setEquipment(EquipmentSlot.Legs, kit.leggings);
	equippable.setEquipment(EquipmentSlot.Feet, kit.boots);
	equippable.setEquipment(EquipmentSlot.Offhand, kit.offhand);
}

interface EntityKitsMapValue {
	kitIndex: number;
	roomTypeId: string;
}

const entityKits = new Map<string, EntityKitsMapValue>(); // key is entityId

function handleDeath(event: EntityDieAfterEvent): void {
	if (!event.deadEntity.isValid) {
		return;
	}
	const kit: Kit | null = getEntityKit(event.deadEntity);
	if (kit?.onDeath) {
		kit.onDeath(event.deadEntity, event.damageSource.damagingEntity);
	}
}

function handleKill(event: EntityDieAfterEvent): void {
	if (
		event.damageSource.damagingEntity === undefined ||
		!event.damageSource.damagingEntity.isValid
	) {
		return;
	}
	const kit: Kit | null = getEntityKit(event.damageSource.damagingEntity);
	if (kit?.onKill) {
		kit.onKill(event.damageSource.damagingEntity, event.deadEntity);
	}
}

export function kitsEntityDieHandler(event: EntityDieAfterEvent): void {
	handleDeath(event);
	handleKill(event);
}

export type KitInventory = { item: ItemStack; slot: number }[];

export interface Kit {
	boots?: ItemStack;
	chestplate?: ItemStack;
	helmet?: ItemStack;
	icon?: string;
	inventory: KitInventory;
	leggings?: ItemStack;
	name: string;
	offhand?: ItemStack;
	onDeath?: (kitUser: Entity, killer?: Entity) => void;
	onKill?: (kitUser: Entity, dead: Entity) => void;
}

export const kits = new Map<string, Kit[]>(); // key is roomTypeId

export function giveKit(entity: Entity, roomTypeId: string, kitIndex: number): Kit | undefined {
	const roomTypeKits: Kit[] | undefined = kits.get(roomTypeId);
	if (roomTypeKits === undefined) {
		return undefined;
	}
	const kit: Kit | undefined = roomTypeKits[kitIndex];
	if (kit === undefined) {
		return undefined;
	}
	const inventory: EntityInventoryComponent | undefined = entity.getComponent(
		EntityComponentTypes.Inventory,
	);
	if (inventory !== undefined) {
		giveKitInventory(kit.inventory, inventory.container);
	}
	const equippable: EntityEquippableComponent | undefined = entity.getComponent(
		EntityComponentTypes.Equippable,
	);
	if (equippable !== undefined) {
		giveKitEquipment(kit, equippable);
	}
	entityKits.set(entity.id, {
		kitIndex: kitIndex,
		roomTypeId: roomTypeId,
	});
	return kit;
}

export function getEntityKit(entity: Entity): Kit | null {
	const value: EntityKitsMapValue | undefined = entityKits.get(entity.id);
	if (value === undefined) {
		return null;
	}
	const roomTypeKits: Kit[] | undefined = kits.get(value.roomTypeId);
	if (roomTypeKits === undefined) {
		return null;
	}
	return roomTypeKits[value.kitIndex] ?? null;
}

export function kitArmorEnchant(kit: Kit, id: string, level = 1): void {
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
