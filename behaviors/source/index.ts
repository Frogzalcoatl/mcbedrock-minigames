/*
This file should import and test everything in behaviors/source/tools/. Once every tool is complete
and tested, they will be used for this minigames map, and any others I create in the future.

Files in behaviors/source/tools/shared/ do not need to be imported and tested, as they are
dependencies for other tools.

Additionally, files in behaviors/source/tools/structureSchemas/ are tested in
behaviors/source/structures/ to avoid cluttering this file's imports with json files.
*/

import "./structures/index";
import {
	CommandPermissionLevel,
	type Entity,
	EntityComponentTypes,
	EquipmentSlot,
	GameMode,
	ItemStack,
	type ItemUseAfterEvent,
	Player,
	type PlayerJoinAfterEvent,
	PlayerPermissionLevel,
	type PlayerSpawnAfterEvent,
	type PlayerSwingStartAfterEvent,
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
	type HitterClearEvent,
	type HitterSetEvent,
	KillTracker,
	type KillTrackerDeathEvent,
} from "./tools/killTracker";
import { kitSelectionForm } from "./tools/kits/form";
import { type Kit, KitManager, kitArmorDurability } from "./tools/kits/manager";
import { ProjectileTracker } from "./tools/projectileTracker";
import { teleportLocationDefault } from "./tools/shared/locations";
import { beamParticles } from "./tools/shared/particles";
import { registerSimulatedPlayerCommands } from "./tools/simulatedPlayers/commands";
import { SimulatedPlayerManager } from "./tools/simulatedPlayers/manager";
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
	fireball.nameTag = "§rFireball";
	items.registerItemUse(fireball, 0, (event: ItemUseAfterEvent): void => {
		throwFireballFromEntity(event.source, MinecraftEntityTypes.Fireball, 10);
	});
	const wand = new ItemStack(MinecraftItemTypes.Stick);
	wand.nameTag = "§rWand";
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
	const leap = new ItemStack(MinecraftItemTypes.Feather);
	leap.nameTag = "§rLeap";
	items.registerItemUse(leap, 100, (event: ItemUseAfterEvent): void => {
		entityLeap(event.source, 5, 0.5);
		event.source.playSound("armor.equip_leather");
	});
	const kitSelectItem = new ItemStack(MinecraftItemTypes.TotemOfUndying);
	kitSelectItem.nameTag = "§rKit Selection";
	items.registerItemUse(kitSelectItem, 0, (event: ItemUseAfterEvent): void => {
		selectKit(event.source);
	});
	items.registerItemSwing(kitSelectItem, (event: PlayerSwingStartAfterEvent): void => {
		selectKit(event.player);
	});
	const killProjectiles = new ItemStack(MinecraftItemTypes.Quartz);
	killProjectiles.nameTag = "§rKill Tracked Projectiles";
	items.registerItemUse(killProjectiles, 0, (event: ItemUseAfterEvent): void => {
		const removed: number = projectileTracker.removeTrackedProjectiles();
		event.source.sendMessage(`Removed ${removed} projectile${removed !== 1 ? "s" : ""}`);
	});
	for (const p of world.getAllPlayers()) {
		const inventory = p.getComponent(EntityComponentTypes.Inventory);
		if (inventory !== undefined) {
			inventory.container.clearAll();
			inventory.container.addItem(fireball);
			inventory.container.addItem(wand);
			inventory.container.addItem(leap);
			inventory.container.addItem(kitSelectItem);
			inventory.container.addItem(killProjectiles);
		}
	}
});

const deathLocationTracker = new DeathLocationTracker();
deathLocationTracker.init();

const teams: Team[] = getDefaultTeamOrders(2, 1);
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

killTracker.onHitterSet.subscribe((event: HitterSetEvent): void => {
	world.sendMessage(`Hitter Set: ${event.hitter.nameTag} on ${event.player.nameTag}`);
});

killTracker.onHitterClear.subscribe((event: HitterClearEvent): void => {
	const player = world.getEntity(event.playerId);
	const oldHitter = world.getEntity(event.oldHitterId);
	world.sendMessage(`Hitter Cleared: ${oldHitter?.nameTag} on ${player?.nameTag}`);
});

killTracker.onDeath.subscribe((event: KillTrackerDeathEvent): void => {
	const deadName: string = world.getEntity(event.deadPlayerId)?.nameTag ?? event.deadPlayerName;
	let killerName: string | null = null;
	if (event.killerId !== undefined) {
		killerName = world.getEntity(event.killerId)?.nameTag ?? null;
	}
	world.sendMessage(deathMessageFormat(deadName, killerName, event.cause, "§7"));
});

const kits = new KitManager();
kits.init();

const starterKit: Kit = {
	icon: "textures/items/wood_sword",
	inventory: [],
	name: "Starter Kit",
};

world.afterEvents.worldLoad.subscribe(() => {
	starterKit.helmet = new ItemStack(MinecraftItemTypes.LeatherHelmet);
	starterKit.chestplate = new ItemStack(MinecraftItemTypes.LeatherChestplate);
	starterKit.leggings = new ItemStack(MinecraftItemTypes.LeatherLeggings);
	starterKit.boots = new ItemStack(MinecraftItemTypes.LeatherBoots);
	starterKit.inventory.push({ item: new ItemStack(MinecraftItemTypes.WoodenSword), slot: 0 });
	kitArmorDurability(starterKit, "unbreakable");
});

async function selectKit(player: Player): Promise<void> {
	player.playSound("random.pop", { pitch: 0.5 });
	const kit: Kit | undefined = await kitSelectionForm([starterKit], player);
	if (kit !== undefined) {
		const inventory = player.getComponent(EntityComponentTypes.Inventory);
		if (inventory !== undefined) {
			inventory.container.clearAll();
		}
		const equippable = player.getComponent(EntityComponentTypes.Equippable);
		if (equippable !== undefined) {
			equippable.setEquipment(EquipmentSlot.Head);
			equippable.setEquipment(EquipmentSlot.Chest);
			equippable.setEquipment(EquipmentSlot.Legs);
			equippable.setEquipment(EquipmentSlot.Feet);
			equippable.setEquipment(EquipmentSlot.Offhand);
		}
		kits.set(player, kit);
		player.sendMessage(`Selected Kit: ${kit.name}`);
	}
}

const projectileTracker = new ProjectileTracker([MinecraftEntityTypes.ThrownTrident]);
projectileTracker.init();

world.afterEvents.worldLoad.subscribe(() => {
	for (const p of world.getAllPlayers()) {
		projectileTracker.trackPlayer(p.id);
	}
});

world.afterEvents.playerJoin.subscribe((event: PlayerJoinAfterEvent) => {
	projectileTracker.trackPlayer(event.playerId);
});
