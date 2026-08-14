import { type ItemStack, type Player, system, world } from "@minecraft/server";

export interface ItemCooldownInfo {
	cooldownTicks: number;
	nameTag: string;
	typeId: string;
}

const items = new Map<string, [string, number, boolean]>(); // [nameTag, [typeId, cooldownTicks, sendCompletionMessage]]
const players = new Map<string, Map<string, number>>(); // [playerId, [itemNameTag, lastUse in Date.now()][]]

// Item must have a nametag
export function setItemCooldown(
	item: ItemStack,
	cooldownTicks: number,
	sendMessage: boolean = false,
): void {
	if (item.nameTag === undefined) {
		return;
	}
	items.set(item.nameTag, [item.typeId, cooldownTicks, sendMessage]);
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
	const entry: [string, number, boolean] | undefined = items.get(item.nameTag);
	if (entry === undefined) {
		return true;
	}
	const [typeId, cooldownTicks, sendCompletionMessage] = entry;
	if (typeId !== item.typeId) {
		return true;
	}
	let playerUseInfo: Map<string, number> | undefined = players.get(player.id);
	if (playerUseInfo === undefined) {
		playerUseInfo = new Map<string, number>();
		players.set(player.id, playerUseInfo);
		playerUseInfo.set(item.nameTag, Date.now());
		if (sendCompletionMessage) {
			sendCooldownMessage(player, item.nameTag, cooldownTicks);
		}
		return true;
	}
	const lastUse: number | undefined = playerUseInfo.get(item.nameTag);
	if (lastUse === undefined) {
		playerUseInfo.set(item.nameTag, Date.now());
		if (sendCompletionMessage) {
			sendCooldownMessage(player, item.nameTag, cooldownTicks);
		}
		return true;
	}
	const differenceMs: number = Date.now() - lastUse;
	if (differenceMs >= cooldownTicks * 50) {
		playerUseInfo.set(item.nameTag, Date.now());
		if (sendCompletionMessage) {
			sendCooldownMessage(player, item.nameTag, cooldownTicks);
		}
		return true;
	} else {
		player.sendMessage(
			`§cPlease wait ${Math.ceil((cooldownTicks * 50 - differenceMs) / 100) / 10}s`,
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
