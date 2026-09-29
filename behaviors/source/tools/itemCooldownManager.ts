import {
	type ItemStack,
	type Player,
	type PlayerLeaveAfterEvent,
	system,
	world,
} from "@minecraft/server";
import { arrRemoveSwap } from "../types";

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
		if (itemInfo === undefined) {
			return true;
		}
		if (itemInfo.typeId !== item.typeId) {
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
