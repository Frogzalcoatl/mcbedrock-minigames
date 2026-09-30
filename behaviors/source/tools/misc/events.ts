import {
	type ChatSendBeforeEvent,
	type EntityDieAfterEvent,
	GameMode,
	type ItemCompleteUseAfterEvent,
	type PlayerLeaveAfterEvent,
	world,
} from "@minecraft/server";
import { SimulatedPlayer } from "@minecraft/server-gametest";
import {
	MinecraftEffectTypes,
	MinecraftEntityTypes,
	MinecraftItemTypes,
} from "@minecraft/vanilla-data";
import { getPlayerName } from "./textFormatting";

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
		`${getPlayerName(event.sender)} §r§l§7»§r ${event.sender.chatMessagePrefix ?? ""}${event.message}`,
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

world.afterEvents.entityDie.subscribe((event: EntityDieAfterEvent) => {
	if (event.deadEntity instanceof SimulatedPlayer) {
		event.deadEntity.respawn();
	}
});

world.afterEvents.itemCompleteUse.subscribe((event: ItemCompleteUseAfterEvent) => {
	// Limit gapple absorption level to match java
	if (event.itemStack.typeId === MinecraftItemTypes.GoldenApple) {
		event.source.removeEffect(MinecraftEffectTypes.Absorption);
		event.source.addEffect(MinecraftEffectTypes.Absorption, 20 * 120);
	}
});
