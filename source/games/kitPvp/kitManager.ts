import {
	type Container,
	type Entity,
	EntityComponentTypes,
	type EntityEquippableComponent,
	type EntityInventoryComponent,
	EquipmentSlot,
	type ItemStack,
	world,
} from "@minecraft/server";
import { clearEntityInventory } from "../../items/clearEntityInventory";
import { getKitArcher } from "./kits/archer";
import { getKitBlaze } from "./kits/blaze";
import { getKitBreeze } from "./kits/breeze";
import { getKitFisherman } from "./kits/fisherman";
import { getKitLancer } from "./kits/lancer";
import { getKitPoseidon } from "./kits/poseidon";
import { getKitRabbit } from "./kits/rabbit";
import { getKitSnowman } from "./kits/snowman";

type KitInventory = { item: ItemStack; slot: number }[];

export interface Kit {
	name: string;
	icon: string; // server-ui icon
	inventory: KitInventory;
	helmet?: ItemStack;
	chestplate?: ItemStack;
	leggings?: ItemStack;
	boots?: ItemStack;
	offhand?: ItemStack;
}

export const kits: Kit[] = [];

world.afterEvents.worldLoad.subscribe(() => {
	kits.push(getKitBlaze());
	kits.push(getKitBreeze());
	kits.push(getKitSnowman());
	kits.push(getKitFisherman());
	kits.push(getKitPoseidon());
	kits.push(getKitRabbit());
	kits.push(getKitArcher());
	kits.push(getKitLancer());
});

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

const entityKits = new Map<string, number>(); // [playerId, kitIndex]

export function giveKit(entity: Entity, kitIndex: number): void {
	if (kitIndex < 0 || kitIndex >= kits.length) {
		return;
	}
	const kit: Kit | undefined = kits[kitIndex];
	if (kit === undefined) {
		return;
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
	entityKits.set(entity.id, kitIndex);
}

export function clearKit(entity: Entity): void {
	if (entityKits.delete(entity.id)) {
		clearEntityInventory(entity);
	}
}

// -1 on undefined
export function getEntityKitIndex(entity: Entity): number {
	return entityKits.get(entity.id) ?? -1;
}
