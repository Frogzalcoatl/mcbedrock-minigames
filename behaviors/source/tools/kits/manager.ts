import {
	type Entity,
	EntityComponentTypes,
	type EntityEquippableComponent,
	type EntityInventoryComponent,
	EquipmentSlot,
	type ItemLockMode,
	type ItemStack,
	type PlayerLeaveAfterEvent,
	world,
} from "@minecraft/server";
import { applyEnchant, setDurability } from "../shared/componentUtils";
import { setEquipmentSafe, setItemSafe } from "../shared/setItemSafe";

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
		const inventory: EntityInventoryComponent | undefined = entity.getComponent(
			EntityComponentTypes.Inventory,
		);
		if (equippable !== undefined) {
			// if a kit equipment slot proeprty is undefined, the slot is cleared.
			if (kit.helmet) {
				setEquipmentSafe(equippable, EquipmentSlot.Head, kit.helmet, inventory, entity);
			}
			if (kit.chestplate) {
				setEquipmentSafe(equippable, EquipmentSlot.Chest, kit.chestplate, inventory, entity);
			}
			if (kit.leggings) {
				setEquipmentSafe(equippable, EquipmentSlot.Legs, kit.leggings, inventory, entity);
			}
			if (kit.boots) {
				setEquipmentSafe(equippable, EquipmentSlot.Feet, kit.boots, inventory, entity);
			}
			if (kit.offhand) {
				setEquipmentSafe(equippable, EquipmentSlot.Offhand, kit.offhand, inventory, entity);
			}
		}
		if (inventory !== undefined) {
			for (const entry of kit.inventory) {
				if (inventory.container.size > entry.slot) {
					setItemSafe(inventory.container, entry.item, entry.slot, {
						dimension: entity.dimension,
						x: entity.location.x,
						y: entity.location.y,
						z: entity.location.z,
					});
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

	public init(): void {
		if (!this._isInitialized) {
			world.afterEvents.playerLeave.subscribe(this.playerLeave);
		}
	}

	public shutdown(): void {
		if (this._isInitialized) {
			world.afterEvents.playerLeave.unsubscribe(this.playerLeave);
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
