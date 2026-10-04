import {
	EntitySwingSource,
	HeldItemOption,
	type ItemStack,
	type ItemUseAfterEvent,
	type Player,
	type PlayerLeaveAfterEvent,
	type PlayerSwingStartAfterEvent,
	system,
	world,
} from "@minecraft/server";
import { arrRemoveSwap } from "../types";

interface ItemUseValue {
	callback: (event: ItemUseAfterEvent) => void;
	typeId: string;
}

interface ItemSwingEntry {
	callback: (event: PlayerSwingStartAfterEvent) => void;
	nameTag: string;
	typeId: string;
}

interface ItemCooldownInfo {
	cooldownTicks: number;
	sendCompletionMessage: boolean;
	typeId: string;
}

interface PlayerItemCooldown {
	itemNameTag: string;
	lastUse: number;
}

export class ItemCooldownManager {
	private readonly _items: Map<string, ItemCooldownInfo>; // key is item nametag
	private readonly _players: Map<string, PlayerItemCooldown[]>;

	public constructor() {
		this._items = new Map<string, ItemCooldownInfo>();
		this._players = new Map<string, PlayerItemCooldown[]>();
	}

	public set(
		nameTag: string,
		typeId: string,
		cooldownTicks: number,
		sendCompletionMessage = false,
	): void {
		this._items.set(nameTag, {
			cooldownTicks: cooldownTicks,
			sendCompletionMessage: sendCompletionMessage,
			typeId: typeId,
		});
	}

	// Returns true when item can be used
	public check(player: Player, item: ItemStack): boolean {
		if (item.nameTag === undefined) {
			return true;
		}
		const itemInfo: ItemCooldownInfo | undefined = this._items.get(item.nameTag);
		if (itemInfo === undefined || itemInfo.typeId !== item.typeId) {
			return true;
		}
		let cooldownData: PlayerItemCooldown[] | undefined = this._players.get(player.id);
		if (cooldownData === undefined) {
			cooldownData = [{ itemNameTag: item.nameTag, lastUse: Date.now() }];
			this._players.set(player.id, cooldownData);
			if (itemInfo.sendCompletionMessage) {
				this.sendCooldownMessage(player, item.nameTag, itemInfo.cooldownTicks);
			}
			return true;
		}
		const cooldownValue: PlayerItemCooldown | undefined = cooldownData.find(
			(v) => v.itemNameTag === item.nameTag,
		);
		if (cooldownValue === undefined) {
			cooldownData.push({ itemNameTag: item.nameTag, lastUse: Date.now() });
			if (itemInfo.sendCompletionMessage) {
				this.sendCooldownMessage(player, item.nameTag, itemInfo.cooldownTicks);
			}
			return true;
		}
		const differenceMs: number = Date.now() - cooldownValue.lastUse;
		if (differenceMs >= itemInfo.cooldownTicks * 50) {
			cooldownValue.lastUse = Date.now();
			if (itemInfo.sendCompletionMessage) {
				this.sendCooldownMessage(player, item.nameTag, itemInfo.cooldownTicks);
			}
			return true;
		} else {
			player.sendMessage(
				`§cPlease wait ${Math.ceil((itemInfo.cooldownTicks * 50 - differenceMs) / 100) / 10}s`,
			);
			return false;
		}
	}

	public removePlayer(player: Player): void {
		this._players.delete(player.id);
	}

	private sendCooldownMessage(player: Player, itemNameTag: string, delayTicks: number): void {
		system.runTimeout(() => {
			const cooldowns = this._players.get(player.id);
			if (cooldowns === undefined) {
				return;
			}
			const cooldown: PlayerItemCooldown | undefined = cooldowns.find(
				(v) => v.itemNameTag === itemNameTag,
			);
			if (cooldown !== undefined) {
				arrRemoveSwap(cooldowns, cooldown);
				player.sendMessage(`Cooldown finished for ${itemNameTag}`);
			}
		}, delayTicks);
	}

	private playerLeave = (event: PlayerLeaveAfterEvent): void => {
		this._players.delete(event.playerId);
	};

	public init(): void {
		world.afterEvents.playerLeave.subscribe(this.playerLeave);
	}

	public shutdown(): void {
		world.afterEvents.playerLeave.unsubscribe(this.playerLeave);
	}
}

export class ItemManager {
	public readonly cooldowns: ItemCooldownManager;
	private readonly _itemUseMap: Map<string, ItemUseValue>;
	private readonly _itemSwingValues: ItemSwingEntry[]; // Using array due to small n

	public constructor() {
		this.cooldowns = new ItemCooldownManager();
		this._itemUseMap = new Map<string, ItemUseValue>();
		this._itemSwingValues = [];
	}

	public onUse(
		nameTag: string,
		typeId: string,
		callback: (event: ItemUseAfterEvent) => void,
	): void {
		this._itemUseMap.set(nameTag, { callback: callback, typeId: typeId });
	}

	public removeOnUse(nameTag: string): void {
		this._itemUseMap.delete(nameTag);
	}

	public onSwing(
		nameTag: string,
		typeId: string,
		callback: (event: PlayerSwingStartAfterEvent) => void,
	): void {
		const foundIndex: number = this._itemSwingValues.findIndex(
			(entry) => entry.nameTag === nameTag,
		);
		const newEntry: ItemSwingEntry = {
			callback: callback,
			nameTag: nameTag,
			typeId: typeId,
		};
		if (foundIndex !== -1) {
			this._itemSwingValues[foundIndex] = newEntry;
		} else {
			this._itemSwingValues.push(newEntry);
		}
	}

	public removeOnSwing(nameTag: string): void {
		const foundIndex: number = this._itemSwingValues.findIndex(
			(entry) => entry.nameTag === nameTag,
		);
		if (foundIndex === -1) {
			return;
		}
		const finalEntry: ItemSwingEntry | undefined =
			this._itemSwingValues[this._itemSwingValues.length - 1];
		if (finalEntry !== undefined) {
			this._itemSwingValues[foundIndex] = finalEntry;
			this._itemSwingValues.pop();
		}
	}

	private itemUse = (event: ItemUseAfterEvent): void => {
		if (event.itemStack.nameTag === undefined) {
			return;
		}
		const value: ItemUseValue | undefined = this._itemUseMap.get(event.itemStack.nameTag);
		if (value !== undefined && value.typeId === event.itemStack.typeId) {
			value.callback(event);
		}
	};

	private playerSwingStart = (event: PlayerSwingStartAfterEvent): void => {
		if (event.heldItemStack === undefined) {
			return;
		}
		const item: ItemStack = event.heldItemStack;
		const entry: ItemSwingEntry | undefined = this._itemSwingValues.find(
			(e) => e.nameTag === item.nameTag && e.typeId === item.typeId,
		);
		if (entry !== undefined) {
			entry.callback(event);
		}
	};

	public init(): void {
		this.cooldowns.init();
		world.afterEvents.itemUse.subscribe(this.itemUse);
		world.afterEvents.playerSwingStart.subscribe(this.playerSwingStart, {
			heldItemOption: HeldItemOption.AnyItem,
			swingSource: EntitySwingSource.Attack,
		});
	}

	public shutdown(): void {
		this.cooldowns.shutdown();
		world.afterEvents.itemUse.unsubscribe(this.itemUse);
		world.afterEvents.playerSwingStart.unsubscribe(this.playerSwingStart);
	}
}
