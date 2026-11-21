// import "./commands/index";
// import "./games/index";
import "./structures/index";
import "./miscEvents";
import {
	CommandPermissionLevel,
	type Entity,
	GameMode,
	ItemStack,
	type ItemUseAfterEvent,
	Player,
	type PlayerJoinAfterEvent,
	PlayerPermissionLevel,
	type PlayerSpawnAfterEvent,
	type PlayerSwingStartAfterEvent,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import { MinecraftEntityTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { PACK_NAMESPACE } from "./constants";
import {
	type ChatCooldownAcceptEvent,
	ChatCooldownManager,
	type ChatCooldownRejectEvent,
} from "./tools/chatCooldown";
import { DeathLocationTracker, deathLocationTeleport } from "./tools/deathLocationTracker";
import { DeathTimeTracker } from "./tools/deathTimeTracker";
import { beamFromEntity } from "./tools/helpers/beam";
import { throwFireballFromEntity } from "./tools/helpers/fireball";
import { entityLeap } from "./tools/helpers/leap";
import { deathMessageFormat } from "./tools/helpers/textFormatting";
import {
	type ItemCooldownCompleteEvent,
	ItemEventManager,
	type ItemUseRejectEvent,
} from "./tools/itemEventManager";
import { JavaGoldenApple } from "./tools/javaGoldenApple";
import {
	type CombatEnterEvent,
	type CombatExitEvent,
	KillTracker,
	type KillTrackerEvent,
} from "./tools/killTracker";
import { teleportLocationDefault } from "./tools/shared/locations";
import { beamParticles } from "./tools/shared/particles";
import { registerSimulatedPlayerCommands } from "./tools/simulatedPlayers/commands";
import {
	type SimulatedPlayerDisconnectEvent,
	SimulatedPlayerManager,
} from "./tools/simulatedPlayers/manager";
import type {
	EliminationManager,
	PlayerEliminationEvent,
	PlayerRespawnEvent,
} from "./tools/teams/eliminationManager";
import { EliminationManagerAutoRespawn } from "./tools/teams/eliminationManagerAutoRespawn";
import { Team } from "./tools/teams/team";
import { getDefaultTeamOrders } from "./tools/teams/teamOrders";
import {
	WaitingRoom,
	type WaitingRoomJoinEvent,
	type WaitingRoomLeaveEvent,
} from "./tools/waitingRoom";

const chatCooldowns = new ChatCooldownManager(10);
chatCooldowns.init();
chatCooldowns.onChatAccept.subscribe((event: ChatCooldownAcceptEvent): void => {
	event.cancelVanillaEvent = true;
	world.sendMessage(
		`${event.sender.chatNamePrefix ?? "§7"}${event.sender.name} §r§l§7»§r ${event.message}`,
	);
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

const simulatedPlayers = new SimulatedPlayerManager(PACK_NAMESPACE, true);
simulatedPlayers.init();
simulatedPlayers.onDisconnect.subscribe((event: SimulatedPlayerDisconnectEvent): void => {
	world.sendMessage(`§e${event.playerName}§r§e left the game`);
});

registerSimulatedPlayerCommands(simulatedPlayers, CommandPermissionLevel.Admin);

const javaGoldenApple = new JavaGoldenApple();
javaGoldenApple.init();

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
	const fireball = new ItemStack(MinecraftItemTypes.FireCharge);
	items.registerItemUse(fireball, 0, (event: ItemUseAfterEvent): void => {
		throwFireballFromEntity(event.source, MinecraftEntityTypes.Fireball, 10);
	});
	items.registerItemSwing(fireball, (event: PlayerSwingStartAfterEvent): void => {
		event.player.sendMessage(`${event.player.nameTag} swung da fireball!`);
	});
	const wand = new ItemStack(MinecraftItemTypes.Stick);
	items.registerItemUse(wand, 20, (event: ItemUseAfterEvent): void => {
		beamFromEntity(
			event.source,
			64,
			(from: Entity, hitLocation: Vector3, _hitEntity?: Entity): void => {
				beamParticles(
					"minecraft:bleach",
					from.dimension,
					from.getHeadLocation(),
					hitLocation,
					1,
				);
			},
		);
	});
	const feather = new ItemStack(MinecraftItemTypes.Feather);
	items.registerItemUse(feather, 100, (event: ItemUseAfterEvent): void => {
		entityLeap(event.source, 5, 0.5);
		event.source.playSound("random.orb");
	});
});

const deathLocationTracker = new DeathLocationTracker();
deathLocationTracker.init();

const teams: Team[] = getDefaultTeamOrders(2, 1);
system.run(() => {});

function joinTeam(player: Player): void {
	for (const t of teams) {
		if (t.join(player)) {
			return;
		}
	}
}

world.afterEvents.playerSpawn.subscribe((event: PlayerSpawnAfterEvent): void => {
	if (event.initialSpawn) {
		joinTeam(event.player);
	}
});

world.afterEvents.worldLoad.subscribe(() => {
	Team.clearAllPlayerStyles();
	for (const t of teams) {
		t.initEliminationManager(teleportLocationDefault());
		if (t.eliminationManager === null) {
			continue;
		}
		t.eliminationManager.spawnPoint.pos.y = -63;
		t.eliminationManager.spawnPoint.facing.y = -63;
		t.eliminationManager.canRespawn = true;
		t.eliminationManager.respawnTimeTicks = 100;
		t.eliminationManager.onRespawnTick.subscribe((event: PlayerRespawnEvent): void => {
			if (event.isInitialTick) {
				event.player.setGameMode(GameMode.Spectator);
				const deathLocation = deathLocationTracker.getDeathLocation(event.player.id);
				if (deathLocation !== undefined) {
					deathLocationTeleport(event.player, deathLocation);
				}
				event.player.onScreenDisplay.setTitle("§cYOU DIED!");
			}
			const secondsRemaining: number = Math.ceil(event.ticksRemaining / 2) / 10;
			event.player.onScreenDisplay.setActionBar(
				`§eYou will respawn in §c${secondsRemaining}§e seconds!`,
			);
		});
		t.eliminationManager.onSpawn.subscribe((event: PlayerSpawnAfterEvent): void => {
			if (!event.initialSpawn) {
				event.player.onScreenDisplay.setTitle("§aRESPAWNED!");
			}
			event.player.setGameMode(GameMode.Adventure);
		});
		t.eliminationManager.onPlayerElimination.subscribe((event: PlayerEliminationEvent): void => {
			world.sendMessage(`${t.colorCode}${event.playerName}§r has been eliminated!`);
			if (event.player !== null) {
				event.player.setGameMode(GameMode.Spectator);
			}
		});
		t.eliminationManager.onFinalElimination.subscribe((_manager: EliminationManager): void => {
			world.sendMessage(`${t.displayName} ${t.colorCode}Team§r has been eliminated!`);
		});
	}
	for (const p of world.getAllPlayers()) {
		joinTeam(p);
	}
});

const deathTimeTracker = new DeathTimeTracker();
deathTimeTracker.init();
const respawns = new EliminationManagerAutoRespawn(deathTimeTracker);
respawns.init();

const killTracker = new KillTracker(140);
killTracker.init();
killTracker.onCombatEnter.subscribe((event: CombatEnterEvent): void => {
	world.sendMessage(`Combat Enter: ${event.player.nameTag} -> ${event.opponent?.nameTag}`);
});
killTracker.onCombatExit.subscribe((event: CombatExitEvent): void => {
	world.sendMessage(`Combat Exit: ${event.player.nameTag} -> ${event.lastOpponent?.nameTag}`);
});
killTracker.onKill.subscribe((event: KillTrackerEvent): void => {
	world.sendMessage(
		deathMessageFormat(event.deadPlayer.name, event.killer?.nameTag ?? null, event.cause ?? null),
	);
});
