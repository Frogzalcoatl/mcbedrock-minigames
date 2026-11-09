import {
	type Entity,
	EntityComponentTypes,
	type EntityDieAfterEvent,
	type EntityEquippableComponent,
	type EntityInventoryComponent,
	EquipmentSlot,
	type ItemLockMode,
	type ItemStack,
	Player,
	type PlayerLeaveAfterEvent,
	world,
} from "@minecraft/server";
import { applyEnchant, setDurability } from "../shared/componentUtils";

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

export class KitManager {
	private readonly _entityKits: Map<string, Kit>;
	private _isInitialized: boolean;

	public constructor() {
		this._entityKits = new Map<string, Kit>();
		this._isInitialized = false;
	}

	public reset(entity: Entity): void {
		this._entityKits.delete(entity.id);
	}

	public get(entity: Entity): Kit | undefined {
		return this._entityKits.get(entity.id);
	}

	public set(entity: Entity, kit: Kit): void {
		this._entityKits.set(entity.id, kit);
		const equippable: EntityEquippableComponent | undefined = entity.getComponent(
			EntityComponentTypes.Equippable,
		);
		if (equippable !== undefined) {
			// if a kit equipment slot is undefined, the slot is cleared.
			equippable.setEquipment(EquipmentSlot.Head, kit.helmet);
			equippable.setEquipment(EquipmentSlot.Chest, kit.chestplate);
			equippable.setEquipment(EquipmentSlot.Legs, kit.leggings);
			equippable.setEquipment(EquipmentSlot.Feet, kit.boots);
			equippable.setEquipment(EquipmentSlot.Offhand, kit.offhand);
		}
		const inventory: EntityInventoryComponent | undefined = entity.getComponent(
			EntityComponentTypes.Inventory,
		);
		if (inventory !== undefined) {
			for (const entry of kit.inventory) {
				if (inventory.container.size > entry.slot) {
					inventory.container.setItem(entry.slot, entry.item);
				}
			}
		}
	}

	public handleDeath(deadEntity: Entity, killer?: Entity): void {
		if (deadEntity.isValid) {
			const kit: Kit | undefined = this._entityKits.get(deadEntity.id);
			if (kit?.onDeath) {
				kit.onDeath(deadEntity, killer);
			}
		}
		if (killer?.isValid) {
			const kit: Kit | undefined = this._entityKits.get(killer.id);
			if (kit?.onKill) {
				kit.onKill(killer, deadEntity);
			}
		}
	}

	private playerLeave = (event: PlayerLeaveAfterEvent): void => {
		this._entityKits.delete(event.playerId);
	};

	private entityDie = (event: EntityDieAfterEvent): void => {
		if (event.deadEntity instanceof Player === false) {
			this._entityKits.delete(event.deadEntity.id);
		}
	};

	public init(): void {
		if (!this._isInitialized) {
			world.afterEvents.playerLeave.subscribe(this.playerLeave);
			world.afterEvents.entityDie.subscribe(this.entityDie);
		}
	}

	public shutdown(): void {
		if (this._isInitialized) {
			world.afterEvents.playerLeave.unsubscribe(this.playerLeave);
			world.afterEvents.entityDie.unsubscribe(this.entityDie);
		}
	}
}

// Helper funcs
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
