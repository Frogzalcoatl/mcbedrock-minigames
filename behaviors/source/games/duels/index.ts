import {
	EntityComponentTypes,
	type EntityDieAfterEvent,
	type EntityInventoryComponent,
	GameMode,
	ItemStack,
} from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { PACK_NAMESPACE, roomTypeIds } from "../../constants";
import { deathMessageFromEvent } from "../../tools/deathMessages";
import { Game, type GameJoinEvent } from "../../tools/games/game";
import { Room } from "../../tools/rooms/room";
import { type RoomCreatorFunc, roomTypeInit } from "../../tools/rooms/roomType";
import { type KillTrackerConfig, killTrackerAddDimension } from "../../tools/trackers/killTracker";
import { GameState } from "../../types";
import { hubEffectHelper } from "../helpers";

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
		const message: string | null = deathMessageFromEvent(event, "§7");
		room.sendMessage(message);
	});
	const game = new Game({
		maxPlayers: 2,
		playersPerTeam: 1,
		playersToStart: 2,
		room: room,
		spectatorPos: { x: 0.5, y: 0, z: 0.5 },
		teamCount: 2,
	});
	game.onJoin.subscribe((event: GameJoinEvent): void => {
		hubEffectHelper(event.player);
		if (event.game.state !== GameState.Active) {
			event.player.setGameMode(GameMode.Adventure);
		}
		const inventory: EntityInventoryComponent | undefined = event.player.getComponent(
			EntityComponentTypes.Inventory,
		);
		if (inventory !== undefined) {
			if (event.game.state === GameState.Starting) {
				inventory.container.setItem(8, new ItemStack(MinecraftItemTypes.RedDye));
			}
		}
	});
	game.whileActive.subscribe((game: Game): void => {
		game.setActionBar(`Seconds Remaining: ${game.secondsRemaining}`);
	});
	game.state = GameState.Starting;
	game.gameDurationSeconds = 10;
	return room;
};

roomTypeInit({
	defaultDimensionId: `${PACK_NAMESPACE}:duels`,
	displayName: "Duels",
	icon: "textures/items/iron_sword.png",
	roomCount: 1,
	roomCreatorFunc: creator,
	typeId: roomTypeIds.duels,
});
