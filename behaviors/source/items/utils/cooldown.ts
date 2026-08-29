import { type ItemStack, type Player, system, world } from "@minecraft/server";

interface ItemCooldownInfo {
	typeId: string;
	cooldownTicks: number;
	sendCompletionMessage: boolean;
}
const items = new Map<string, ItemCooldownInfo>(); // [itemNameTag, info]

interface PlayerItemCooldown {
	itemNameTag: string;
	lastUse: number;
}
const playerCooldownData = new Map<string, PlayerItemCooldown[]>(); // [playerId, values[]]

// Item must have a nametag
export function itemCooldownSet(
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

export function itemCooldownRemove(nameTag: string): void {
	items.delete(nameTag);
}

function sendCooldownMessage(player: Player, itemNameTag: string, delayTicks: number): void {
	system.runTimeout(() => {
		const playerCooldownValues = playerCooldownData.get(player.id);
		if (playerCooldownValues === undefined) {
			return;
		}
		const itemIndex = playerCooldownValues.findIndex((v) => v.itemNameTag === itemNameTag);
		if (itemIndex !== -1) {
			playerCooldownValues.splice(itemIndex, 1);
			player.sendMessage(`Cooldown finished for ${itemNameTag}`);
		}
	}, delayTicks);
}

export function itemCooldownCheck(player: Player, item: ItemStack): boolean {
	if (item.nameTag === undefined) {
		return true;
	}
	const itemInfo: ItemCooldownInfo | undefined = items.get(item.nameTag);
	if (itemInfo === undefined) {
		return true;
	}
	if (itemInfo.typeId !== item.typeId) {
		return true;
	}
	let cooldownData: PlayerItemCooldown[] | undefined = playerCooldownData.get(player.id);
	if (cooldownData === undefined) {
		cooldownData = [{ itemNameTag: item.nameTag, lastUse: Date.now() }];
		playerCooldownData.set(player.id, cooldownData);
		if (itemInfo.sendCompletionMessage) {
			sendCooldownMessage(player, item.nameTag, itemInfo.cooldownTicks);
		}
		return true;
	}
	const cooldownValue: PlayerItemCooldown | undefined = cooldownData.find(
		(v) => v.itemNameTag === item.nameTag,
	);
	if (cooldownValue === undefined) {
		cooldownData.push({ itemNameTag: item.nameTag, lastUse: Date.now() });
		if (itemInfo.sendCompletionMessage) {
			sendCooldownMessage(player, item.nameTag, itemInfo.cooldownTicks);
		}
		return true;
	}
	const differenceMs: number = Date.now() - cooldownValue.lastUse;
	if (differenceMs >= itemInfo.cooldownTicks * 50) {
		cooldownValue.lastUse = Date.now();
		if (itemInfo.sendCompletionMessage) {
			sendCooldownMessage(player, item.nameTag, itemInfo.cooldownTicks);
		}
		return true;
	} else {
		player.sendMessage(
			`§cPlease wait ${Math.ceil((itemInfo.cooldownTicks * 50 - differenceMs) / 100) / 10}s`,
		);
		return false;
	}
}

export function itemCooldownRemovePlayer(player: Player): void {
	playerCooldownData.delete(player.id);
}

world.beforeEvents.playerLeave.subscribe((event) => {
	playerCooldownData.delete(event.player.id);
});
