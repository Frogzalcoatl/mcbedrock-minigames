import {
	type ChatSendBeforeEvent,
	GameMode,
	type PlayerLeaveAfterEvent,
	world,
} from "@minecraft/server";
import { playerDisplayName } from "./textFormatting";

const chatTimestamps = new Map<string, number>();
const chatCooldownMs: number = 500;

world.beforeEvents.chatSend.subscribe((event: ChatSendBeforeEvent) => {
	event.cancel = true;
	const timestamp: number | undefined = chatTimestamps.get(event.sender.id);
	if (timestamp !== undefined && timestamp + chatCooldownMs > Date.now()) {
		event.sender.sendMessage("§cYou are sending messages too fast!");
		return;
	}
	world.sendMessage(
		`${playerDisplayName(event.sender)} §r§l§7»§r ${event.sender.chatMessagePrefix ?? ""}${event.message}`,
	);
	chatTimestamps.set(event.sender.id, Date.now());
});

world.afterEvents.playerLeave.subscribe((event: PlayerLeaveAfterEvent) => {
	chatTimestamps.delete(event.playerId);
});

// Currently no games that need block interaction enabled.
world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
	if (event.player.getGameMode() !== GameMode.Creative) {
		event.cancel = true;
	}
});

world.afterEvents.projectileHitBlock.subscribe((event) => {
	if (event.projectile.isValid && event.projectile.typeId === MinecraftEntityTypes.Arrow) {
		event.projectile.remove();
	}
});
