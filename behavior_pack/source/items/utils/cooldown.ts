import { type ItemStack, type Player, system, world } from "@minecraft/server";

export interface ItemCooldownInfo {
	cooldownTicks: number;
	nameTag: string;
	typeId: string;
}

interface ItemMapValue {
	typeId: string;
	cooldownTicks: number;
	sendCompletionMessage: boolean;
}

const items = new Map<string, ItemMapValue>(); // key is item nameTag
const players = new Map<string, Map<string, number>>(); // [playerId, [itemNameTag, lastUse in Date.now()][]]

// Item must have a nametag
export function setItemCooldown(
	nameTag: string,
	typeId: string,
	cooldownTicks: number,
	sendCompletionMessage: boolean = false,
): void {
	items.set(nameTag, {
		cooldownTicks: cooldownTicks,
		sendCompletionMessage: sendCompletionMessage,
		typeId: typeId,
	});
}

export function removeItemCooldown(nameTag: string): void {
	items.delete(nameTag);
}

function sendCooldownMessage(player: Player, itemNameTag: string, delayTicks: number): void {
	system.runTimeout(() => {
		if (players.has(player.id)) {
			player.sendMessage(`Cooldown finished for ${itemNameTag}`);
		}
	}, delayTicks);
}

export function isItemCooldownFinished(player: Player, item: ItemStack): boolean {
	if (item.nameTag === undefined) {
		return true;
	}
	const value: ItemMapValue | undefined = items.get(item.nameTag);
	if (value === undefined) {
		return true;
	}
	if (value.typeId !== item.typeId) {
		return true;
	}
	let playerUseInfo: Map<string, number> | undefined = players.get(player.id);
	if (playerUseInfo === undefined) {
		playerUseInfo = new Map<string, number>();
		players.set(player.id, playerUseInfo);
		playerUseInfo.set(item.nameTag, Date.now());
		if (value.sendCompletionMessage) {
			sendCooldownMessage(player, item.nameTag, value.cooldownTicks);
		}
		return true;
	}
	const lastUse: number | undefined = playerUseInfo.get(item.nameTag);
	if (lastUse === undefined) {
		playerUseInfo.set(item.nameTag, Date.now());
		if (value.sendCompletionMessage) {
			sendCooldownMessage(player, item.nameTag, value.cooldownTicks);
		}
		return true;
	}
	const differenceMs: number = Date.now() - lastUse;
	if (differenceMs >= value.cooldownTicks * 50) {
		playerUseInfo.set(item.nameTag, Date.now());
		if (value.sendCompletionMessage) {
			sendCooldownMessage(player, item.nameTag, value.cooldownTicks);
		}
		return true;
	} else {
		player.sendMessage(
			`§cPlease wait ${Math.ceil((value.cooldownTicks * 50 - differenceMs) / 100) / 10}s`,
		);
		return false;
	}
}

export function clearPlayerCooldowns(player: Player): void {
	players.delete(player.id);
}

world.beforeEvents.playerLeave.subscribe((event) => {
	players.delete(event.player.id);
});
