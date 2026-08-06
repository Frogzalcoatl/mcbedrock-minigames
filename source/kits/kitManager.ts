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
import { clearEntityInventory } from "../entities/clearEntityInventory";
import "./entityDie";
import { getKitArcher } from "../games/kitPvp/kits/archer";
import { getKitBlaze } from "../games/kitPvp/kits/blaze";
import { getKitBreeze } from "../games/kitPvp/kits/breeze";
import { getKitFisherman } from "../games/kitPvp/kits/fisherman";
import { getKitLancer } from "../games/kitPvp/kits/lancer";
import { getKitPoseidon } from "../games/kitPvp/kits/poseidon";
import { getKitRabbit } from "../games/kitPvp/kits/rabbit";
import { getKitSnowman } from "../games/kitPvp/kits/snowman";

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
	onDeath?: (kitUser: Entity, killer?: Entity) => void;
	onKill?: (kitUser: Entity, dead: Entity) => void;
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

const entityKits = new Map<string, number>(); // [entityId, kitIndex]

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

export function getEntityKit(entity: Entity): Kit | null {
	const kitIndex: number = getEntityKitIndex(entity);
	if (kitIndex === -1) {
		return null;
	}
	return kits[kitIndex] ?? null;
}
