import {
	EntityComponentTypes,
	type EntityDieAfterEvent,
	type EntityInventoryComponent,
	GameMode,
	ItemStack,
	type Player,
	system,
} from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { PACK_NAMESPACE, roomTypeIds } from "../../constants";
import { clearEntityEquippable } from "../../tools/componentHelpers";
import { Game } from "../../tools/game/game";
import type { Team } from "../../tools/game/team";
import { deathMessageFromEvent, formatTimeSeconds } from "../../tools/game/textFormatting";
import { Room } from "../../tools/room/room";
import { type RoomCreatorFunc, RoomType } from "../../tools/room/roomType";
import { type KillTrackerConfig, killTrackerAddDimension } from "../../tools/trackers/killTracker";
import { GameState, QueueMode, type TeleportLocation } from "../../types";

const creator: RoomCreatorFunc = (dimensionId: string, displayName: string, icon: string): Room => {
	const room = new Room({
		dimensionId: dimensionId,
		displayName: displayName,
		icon: icon,
		spawn: {
			facing: { x: 0.5, y: 0, z: 1 },
			pos: { x: 0.5, y: 0, z: 0.5 },
		},
		structures: [{ id: "frogzalcoatl/duels/mangrove", pos: { x: -133, y: -3, z: -68 } }],
	});
	const killTracker: KillTrackerConfig = killTrackerAddDimension(room.dimensionId);
	killTracker.onKill.subscribe((event: EntityDieAfterEvent) => {
		room.sendMessage(deathMessageFromEvent(event));
	});
	const game = new Game({
		maxPlayers: 2,
		playersPerTeam: 1,
		playersToStart: 2,
		room: room,
		spectatorPos: { x: -60, y: 0, z: 2 },
		teamCount: 2,
	});
	const spawnPoints: TeleportLocation[] = [
		{
			facing: {
				x: -59.5,
				y: -1,
				z: 29.5,
			},
			pos: {
				x: -59.5,
				y: -1,
				z: 30.5,
			},
		},
		{
			facing: {
				x: -59.5,
				y: -1,
				z: -21.5,
			},
			pos: {
				x: -59.5,
				y: -1,
				z: -22.5,
			},
		},
	];
	for (let i = 0; i < spawnPoints.length; i++) {
		const spawnPoint: TeleportLocation | undefined = spawnPoints[i];
		if (spawnPoint === undefined) {
			break;
		}
		const team: Team | undefined = game.teams[i];
		if (team === undefined) {
			break;
		}
		team.spawnPoint = spawnPoint;
	}
	game.onStart.subscribe((game: Game) => {
		const players: Player[] = game.players;
		const woodenSword = new ItemStack(MinecraftItemTypes.WoodenSword);
		for (const p of players) {
			clearEntityEquippable(p);
			const inventory: EntityInventoryComponent | undefined = p.getComponent(
				EntityComponentTypes.Inventory,
			);
			if (inventory !== undefined) {
				inventory.container.clearAll();
				inventory.container.setItem(0, woodenSword);
			}
		}
	});
	game.whileActive.subscribe((game: Game): void => {
		game.setActionBar(`Time Remaining: §7${formatTimeSeconds(game.secondsRemaining)}`);
	});
	game.endGame = (game: Game): void => {
		for (const p of game.players) {
			p.setGameMode(GameMode.Spectator);
		}
		system.runTimeout(() => {
			game.state = GameState.Resetting;
		}, 100);
	};
	game.startTimeSeconds = 10;
	game.state = GameState.Open;
	return room;
};

new RoomType({
	defaultDimensionId: `${PACK_NAMESPACE}:duels`,
	displayName: "Duels",
	icon: "textures/items/iron_sword.png",
	queueMode: QueueMode.GameRandom,
	roomCount: 3,
	roomCreatorFunc: creator,
	typeId: roomTypeIds.duels,
});
