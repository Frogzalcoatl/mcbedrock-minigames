import { type ItemStack, type Player, world } from "@minecraft/server";

export interface ItemCooldownInfo {
	typeId: string;
	nameTag: string;
	cooldownTicks: number;
}

const items = new Map<string, [string, number]>(); // [nameTag, [typeId, cooldownTicks]]
const players = new Map<string, Map<string, number>>(); // [playerId, [itemNameTag, lastUse in Date.now()][]]

// Item must have a nametag
export function setItemCooldown(item: ItemStack, cooldownTicks: number): void {
	items.set(item.nameTag ?? "", [item.typeId, cooldownTicks]);
}

export function removeItemCooldown(nameTag: string): void {
	items.delete(nameTag);
}

export function isItemCooldownFinished(player: Player, item: ItemStack): boolean {
	if (!player.isValid || item.nameTag === undefined) {
		return true;
	}
	const cooldownEntry: [string, number] | undefined = items.get(item.nameTag);
	if (cooldownEntry === undefined) {
		return true;
	}
	const [typeId, cooldownTicks] = cooldownEntry;
	if (typeId !== item.typeId) {
		return true;
	}
	let playerUseInfo: Map<string, number> | undefined = players.get(player.id);
	if (playerUseInfo === undefined) {
		playerUseInfo = new Map<string, number>();
		players.set(player.id, playerUseInfo);
		playerUseInfo.set(item.nameTag, Date.now());
		return true;
	}
	const lastUse: number | undefined = playerUseInfo.get(item.nameTag);
	if (lastUse === undefined || Date.now() - lastUse >= cooldownTicks * 50) {
		playerUseInfo.set(item.nameTag, Date.now());
		return true;
	} else {
		return false;
	}
}

world.beforeEvents.playerLeave.subscribe((event) => {
	players.delete(event.player.id);
});
