// import "./commands/index";
// import "./games/index";
import "./structures/index";
import "./miscEvents";
import {
	type Entity,
	ItemStack,
	type ItemUseAfterEvent,
	Player,
	type PlayerJoinAfterEvent,
	PlayerPermissionLevel,
	type PlayerSwingStartAfterEvent,
	world,
} from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { PACK_NAMESPACE } from "./constants";
import {
	type ChatCooldownAcceptEvent,
	ChatCooldownManager,
	type ChatCooldownRejectEvent,
} from "./tools/chatCooldown";
import { initJavaGoldenApple } from "./tools/helpers/javaGoldenApple";
import {
	type ItemCooldownCompleteEvent,
	ItemEventManager,
	type ItemUseRejectEvent,
} from "./tools/itemEventManager";
import { registerSimulatedPlayerCommands } from "./tools/simulatedPlayers/commands";
import { SimulatedPlayerManager } from "./tools/simulatedPlayers/manager";
import {
	WaitingRoom,
	type WaitingRoomJoinEvent,
	type WaitingRoomLeaveEvent,
} from "./tools/waitingRoom";

const chatCooldowns = new ChatCooldownManager(10);
chatCooldowns.init();
chatCooldowns.onChatAccept.subscribe((event: ChatCooldownAcceptEvent): void => {
	event.cancelVanilla = true;
	world.sendMessage(`§7${event.sender.name} §r§l§7»§r ${event.message}`);
});

chatCooldowns.onChatReject.subscribe((event: ChatCooldownRejectEvent): void => {
	const secondsRemaining: number = Math.ceil(event.ticksRemaining / 2) / 10;
	event.sender.sendMessage(
		`§cPlease wait ${secondsRemaining} second${secondsRemaining !== 1 ? "s" : ""}`,
	);
});

chatCooldowns.isBypassed = (player: Player): boolean => {
	return player.playerPermissionLevel === PlayerPermissionLevel.Operator;
};

registerSimulatedPlayerCommands(new SimulatedPlayerManager(PACK_NAMESPACE, true));

initJavaGoldenApple();

const waitingRoom = new WaitingRoom({
	countdownDurationSeconds: 15,
	maxPlayersForCompletion: 8,
	minPlayersForCompletion: 2,
	playersToStartCountdown: 4,
});

waitingRoom.onWaitingTick.subscribe((room: WaitingRoom): void => {
	const players: Player[] = room.getPlayers();
	const playersNeeded: number = room.playersToStartCountdown - players.length;
	const actionbar: string = `§cWaiting for ${playersNeeded} more player${playersNeeded !== 1 ? "s" : ""}...`;
	for (const p of players) {
		p.onScreenDisplay.setActionBar(actionbar);
	}
});

waitingRoom.onCountdownTick.subscribe((room: WaitingRoom): void => {
	const players: Player[] = room.getPlayers();
	const actionbar: string = `Starting in §l${room.secondsRemaining}§r second${room.secondsRemaining !== 1 ? "s" : ""}`;
	for (const p of players) {
		p.onScreenDisplay.setActionBar(actionbar);
	}
	const playSound: boolean = [1, 2, 3, 4, 5, 10, 15].includes(room.secondsRemaining);
	if (playSound) {
		const sound: string = "random.click";
		for (const p of players) {
			p.playSound(sound);
		}
	}
});

waitingRoom.onPlayerJoin.subscribe((event: WaitingRoomJoinEvent): void => {
	const players: Player[] = event.room.getPlayers();
	const message: string = `§7${event.player.name} joined the game [${players.length}/${event.room.maxPlayersForCompletion}]`;
	for (const p of players) {
		p.sendMessage(message);
	}
});

waitingRoom.onPlayerLeave.subscribe((event: WaitingRoomLeaveEvent): void => {
	const players: Player[] = event.room.getPlayers();
	const message: string = `§7${event.playerName} left the game [${players.length}/${event.room.maxPlayersForCompletion}]`;
	for (const p of players) {
		p.sendMessage(message);
	}
});

waitingRoom.onCountdownCancelled.subscribe((room: WaitingRoom): void => {
	const players: Player[] = room.getPlayers();
	const playersNeeded: number = room.playersToStartCountdown - players.length;
	const message: string = `§cCountdown canceled! Waiting for ${playersNeeded} more player${playersNeeded !== 1 ? "s" : ""}...`;
	const actionbar: string = "§cCancelled!";
	const sound: string = "note.bass";
	for (const p of players) {
		p.sendMessage(message);
		p.onScreenDisplay.setActionBar(actionbar);
		p.playSound(sound);
	}
});

waitingRoom.onCountdownComplete.subscribe((_room: WaitingRoom): void => {
	world.sendMessage("Game Started!");
});

world.afterEvents.worldLoad.subscribe((): void => {
	for (const p of world.getAllPlayers()) {
		waitingRoom.join(p);
	}
});

world.afterEvents.playerJoin.subscribe((event: PlayerJoinAfterEvent): void => {
	const player: Entity | undefined = world.getEntity(event.playerId);
	if (player instanceof Player) {
		waitingRoom.join(player);
	}
});

const items = new ItemEventManager();

items.init();

items.onUseReject.subscribe((event: ItemUseRejectEvent): void => {
	const seconds: number = Math.ceil(event.ticksRemaining / 2) / 10;
	event.player.sendMessage(`§cPlease wait ${seconds}s before using this again.`);
});

items.onCooldownComplete.subscribe((event: ItemCooldownCompleteEvent): void => {
	event.player.sendMessage(`Cooldown complete for ${event.item.nameTag ?? event.item.typeId}`);
});

world.afterEvents.worldLoad.subscribe(() => {
	const stick = new ItemStack(MinecraftItemTypes.Stick);
	items.registerItemUse(stick, 60, (event: ItemUseAfterEvent): void => {
		event.source.sendMessage("Use!");
	});
	items.registerItemSwing(stick, (event: PlayerSwingStartAfterEvent): void => {
		event.player.sendMessage("Swing!");
	});
});
