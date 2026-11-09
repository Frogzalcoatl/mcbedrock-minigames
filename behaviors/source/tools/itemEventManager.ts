import {
	EntitySwingSource,
	HeldItemOption,
	ItemComponentTypes,
	type ItemCooldownComponent,
	type ItemStack,
	type ItemUseAfterEvent,
	type Player,
	type PlayerSwingStartAfterEvent,
	system,
	world,
} from "@minecraft/server";
import { EventSignal } from "./shared/eventSignal";

interface ItemUseEntry {
	callback: (event: ItemUseAfterEvent) => void;
	cooldownTicks: number;
}

type ItemSwingHandler = (event: PlayerSwingStartAfterEvent) => void;

export interface ItemUseRejectEvent {
	item: ItemStack;
	player: Player;
	ticksRemaining: number;
}

export interface ItemCooldownCompleteEvent {
	item: ItemStack;
	player: Player;
}

export function itemCooldownsCategory(item: ItemStack): string {
	const cooldownComponent: ItemCooldownComponent | undefined = item.getComponent(
		ItemComponentTypes.Cooldown,
	);
	return cooldownComponent?.cooldownCategory ?? `${item.typeId}:${item.nameTag ?? "default"}`;
}

export class ItemEventManager {
	public readonly onUseReject: EventSignal<ItemUseRejectEvent>;
	public readonly onCooldownComplete: EventSignal<ItemCooldownCompleteEvent>;
	private readonly _itemUse: Map<string, ItemUseEntry>;
	private readonly _itemSwing: Map<string, ItemSwingHandler>;
	private _isInitialized: boolean;

	public constructor() {
		this.onUseReject = new EventSignal();
		this.onCooldownComplete = new EventSignal();
		this._itemUse = new Map();
		this._itemSwing = new Map();
		this._isInitialized = false;
	}

	public registerItemUse(
		item: ItemStack,
		cooldownTicks: number,
		callback: (event: ItemUseAfterEvent) => void,
	): void {
		this._itemUse.set(itemCooldownsCategory(item), {
			callback: callback,
			cooldownTicks: cooldownTicks,
		});
	}

	public unregisterItemUse(item: ItemStack): boolean {
		return this._itemUse.delete(itemCooldownsCategory(item));
	}

	public registerItemSwing(
		item: ItemStack,
		callback: (event: PlayerSwingStartAfterEvent) => void,
	): void {
		this._itemSwing.set(itemCooldownsCategory(item), callback);
	}

	public unregisterItemSwing(item: ItemStack): boolean {
		return this._itemSwing.delete(itemCooldownsCategory(item));
	}

	private itemUse = (event: ItemUseAfterEvent): void => {
		const category: string = itemCooldownsCategory(event.itemStack);
		const entry: ItemUseEntry | undefined = this._itemUse.get(category);
		if (entry === undefined) {
			return;
		}
		if (entry.cooldownTicks <= 0) {
			entry.callback(event);
			return;
		}
		if (event.source.getItemCooldown(category) <= 0) {
			entry.callback(event);
			event.source.startItemCooldown(category, entry.cooldownTicks);
			system.runTimeout(() => {
				if (event.source.isValid) {
					this.onCooldownComplete.triggerEvent({
						item: event.itemStack,
						player: event.source,
					});
				}
			}, entry.cooldownTicks);
		} else {
			const rejectEvent: ItemUseRejectEvent = {
				item: event.itemStack,
				player: event.source,
				ticksRemaining: event.source.getItemCooldown(category),
			};
			this.onUseReject.triggerEvent(rejectEvent);
		}
	};

	private playerSwing = (event: PlayerSwingStartAfterEvent): void => {
		if (event.heldItemStack === undefined) {
			return;
		}
		const callback: ItemSwingHandler | undefined = this._itemSwing.get(
			itemCooldownsCategory(event.heldItemStack),
		);
		if (callback !== undefined) {
			callback(event);
		}
	};

	public init(): void {
		if (!this._isInitialized) {
			world.afterEvents.itemUse.subscribe(this.itemUse);
			world.afterEvents.playerSwingStart.subscribe(this.playerSwing, {
				heldItemOption: HeldItemOption.AnyItem,
				swingSource: EntitySwingSource.Attack,
			});
			this._isInitialized = true;
		}
	}

	public shutdown(): void {
		if (this._isInitialized) {
			world.afterEvents.itemUse.unsubscribe(this.itemUse);
			world.afterEvents.playerSwingStart.unsubscribe(this.playerSwing);
			this._isInitialized = false;
		}
	}
}
