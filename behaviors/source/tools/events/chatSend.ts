import { type ChatSendBeforeEvent, type PlayerLeaveAfterEvent, world } from "@minecraft/server";
import { getPlayerName } from "../textFormatting";

const timestamps = new Map<string, number>();
const cooldownMs: number = 500;

world.beforeEvents.chatSend.subscribe((event: ChatSendBeforeEvent) => {
	event.cancel = true;
	const timestamp: number | undefined = timestamps.get(event.sender.id);
	if (timestamp !== undefined && timestamp + cooldownMs > Date.now()) {
		event.sender.sendMessage("§cYou are sending messages too fast!");
		return;
	}
	world.sendMessage(
		`${getPlayerName(event.sender)} §r§l§7»§r ${event.sender.chatMessagePrefix ?? ""}${event.message}`,
	);
	timestamps.set(event.sender.id, Date.now());
});

world.afterEvents.playerLeave.subscribe((event: PlayerLeaveAfterEvent) => {
	timestamps.delete(event.playerId);
});
