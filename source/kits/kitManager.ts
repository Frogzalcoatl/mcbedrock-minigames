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
	if (!container.isValid) {
		return;
	}
	for (const entry of kitInventory) {
		if (container.size <= entry.slot || entry.slot < 0) {
			continue;
		}
		container.setItem(entry.slot, entry.item);
	}
}

function giveKitEquipment(kit: Kit, equippable: EntityEquippableComponent): void {
	if (!equippable.isValid) {
		return;
	}
	// if a equipment slot isnt defined it is cleared
	equippable.setEquipment(EquipmentSlot.Head, kit.helmet);
	equippable.setEquipment(EquipmentSlot.Chest, kit.chestplate);
	equippable.setEquipment(EquipmentSlot.Legs, kit.leggings);
	equippable.setEquipment(EquipmentSlot.Feet, kit.boots);
	equippable.setEquipment(EquipmentSlot.Offhand, kit.offhand);
}

const entityKits = new Map<string, [string, number]>(); // [entityId, [roomTypeId, kitIndex]]

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
	if (inventory?.isValid) {
		giveKitInventory(kit.inventory, inventory.container);
	}
	const equippable: EntityEquippableComponent | undefined = entity.getComponent(
		EntityComponentTypes.Equippable,
	);
	if (equippable !== undefined) {
		giveKitEquipment(kit, equippable);
	}
	entityKits.set(entity.id, [roomTypeId, kitIndex]);
	return kit;
}

export function getEntityKit(entity: Entity): Kit | null {
	const kitInfo: [string, number] | undefined = entityKits.get(entity.id);
	if (kitInfo === undefined) {
		return null;
	}
	const roomTypeKits: Kit[] | undefined = kits.get(kitInfo[0]);
	if (roomTypeKits === undefined) {
		return null;
	}
	return roomTypeKits[kitInfo[1]] ?? null;
}
