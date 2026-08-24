import {
	type Container,
	type Entity,
	EntityComponentTypes,
	type EntityEquippableComponent,
	type EntityInventoryComponent,
	EquipmentSlot,
	type ItemStack,
	type Player,
} from "@minecraft/server";
import "./entityDie";

type KitInventory = { item: ItemStack; slot: number }[];

export interface Kit {
	name: string;
	inventory: KitInventory;
	helmet?: ItemStack;
	chestplate?: ItemStack;
	leggings?: ItemStack;
	boots?: ItemStack;
	offhand?: ItemStack;
	icon?: string; // server-ui icon
	onDeath?: (kitUser: Player, killer?: Entity) => void;
	onKill?: (kitUser: Player, dead: Entity) => void;
}

export const kits = new Map<string, Kit[]>(); // [roomTypeId, kits]

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
	roomTypeId: string;
	kitIndex: number;
}

const entityKits = new Map<string, EntityKitsMapValue>(); // [entityId, [roomTypeId, kitIndex]]

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
