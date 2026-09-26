import {
	GameMode,
	type Player,
	PlayerPermissionLevel,
	type PlayerSpawnAfterEvent,
	type StartupEvent,
	system,
	world,
} from "@minecraft/server";
import { SimulatedPlayer } from "@minecraft/server-gametest";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import { PACK_NAMESPACE, roomTypeIds } from "../../constants";
import { safeActionFormShow } from "../../forms/safeShow";
import { GameState, QueueMode } from "../../types";
import { Game } from "../game/game";
import { Room } from "./room";

system.beforeEvents.startup.subscribe((event: StartupEvent) => {
	for (const type of RoomType.getAll()) {
		for (const room of type.rooms) {
			room.registerDimension(event.dimensionRegistry);
		}
	}
});

world.afterEvents.worldLoad.subscribe(() => {
	const hubRoomType: RoomType | undefined = RoomType.get(roomTypeIds.hub);
	if (hubRoomType === undefined) {
		return;
	}
	const firstHub: Room | undefined = hubRoomType.rooms[0];
	if (firstHub === undefined) {
		return;
	}
	for (const p of world.getAllPlayers()) {
		if (
			p.playerPermissionLevel === PlayerPermissionLevel.Operator &&
			p.getGameMode() === GameMode.Creative
		) {
			continue;
		}
		firstHub.join(p);
	}
});

const propertyInitialSpawnTransfer: string = "initial_spawn_room_transfer";

world.afterEvents.playerSpawn.subscribe((event: PlayerSpawnAfterEvent) => {
	if (!event.initialSpawn) {
		return;
	}
	event.player.setDynamicProperty(propertyInitialSpawnTransfer, true);
	const hubRoomType: RoomType | undefined = RoomType.get(roomTypeIds.hub);
	if (hubRoomType === undefined) {
		return;
	}
	const hub: Room | undefined = hubRoomType.rooms[0];
	if (event.player instanceof SimulatedPlayer) {
		// Spawn sim players in same room as origin and run room.join as if they joined from hub
		const room: Room | undefined = Room.get(event.player.dimension.id);
		if (room?.join(event.player, hub)) {
			return;
		}
	}
	hub?.join(event.player, hub);
});

export function isInitialSpawnTransfer(player: Player): boolean {
	if (player.getDynamicProperty(propertyInitialSpawnTransfer) !== undefined) {
		player.setDynamicProperty(propertyInitialSpawnTransfer, undefined);
		return true;
	} else {
		return false;
	}
}

export type RoomCreatorFunc = (dimensionId: string, displayName: string, icon: string) => Room;

export interface RoomTypeConfig {
	defaultDimensionId: string;
	displayName: string;
	icon?: string;
	queueMode?: QueueMode;
	roomCount: number;
	roomCreatorFunc: RoomCreatorFunc;
	typeId: string;
}

export class RoomType {
	private static _globalTypes: RoomType[] = [];

	public static get(typeId: string): RoomType | undefined {
		return RoomType._globalTypes.find((t) => t.typeId === typeId);
	}

	public static getAll(): RoomType[] {
		return RoomType._globalTypes;
	}

	public static async join(typeId: string, player: Player): Promise<boolean> {
		const type: RoomType | undefined = RoomType.get(typeId);
		return (await type?.queue(player)) ?? false;
	}

	public displayName: string;
	public icon: string;
	public queueMode: QueueMode;
	public readonly rooms: Room[];
	public readonly typeId: string;

	public constructor(config: RoomTypeConfig) {
		RoomType._globalTypes.push(this);
		this.displayName = config.displayName;
		this.queueMode = config.queueMode ?? QueueMode.Form;
		this.icon = config.icon ?? "";
		this.rooms = [];
		this.typeId = config.typeId;
		if (config.roomCount < 1) {
			return;
		}
		if (!config.defaultDimensionId.startsWith("minecraft:")) {
			for (let i = 0; i < config.roomCount; i++) {
				this.rooms.push(
					config.roomCreatorFunc(
						`${config.defaultDimensionId}-${i + 1}`,
						`${this.displayName} ${i + 1}`,
						this.icon,
					),
				);
			}
			return;
		}
		this.rooms.push(
			config.roomCreatorFunc(config.defaultDimensionId, `${this.displayName} 1`, this.icon),
		);
		if (config.roomCount === 1) {
			return;
		}
		const colonIndex: number = config.defaultDimensionId.indexOf(":");
		const customDimensionId: string = `${PACK_NAMESPACE}:${config.defaultDimensionId.slice(colonIndex + 1)}`;
		for (let i = 1; i < config.roomCount; i++) {
			this.rooms.push(
				config.roomCreatorFunc(
					`${customDimensionId}-${i + 1}`,
					`${this.displayName} ${i + 1}`,
					this.icon,
				),
			);
		}
	}

	private joinGameWithPlayersWaiting(player: Player): boolean {
		const hasPlayersWaiting: Room[] = [];
		for (let i = 0; i < this.rooms.length; i++) {
			const room: Room | undefined = this.rooms[i];
			if (room === undefined) {
				continue;
			}
			const game: Game | undefined = Game.get(room.dimensionId);
			if (
				game !== undefined &&
				game.state === GameState.Open &&
				game.players.length > 0 &&
				game.players.length < game.maxPlayers
			) {
				hasPlayersWaiting.push(room);
			}
		}
		const randomIndex: number = Math.floor(Math.random() * hasPlayersWaiting.length);
		for (let i = 0; i < hasPlayersWaiting.length; i++) {
			const room: Room | undefined = this.rooms[(randomIndex + i) % hasPlayersWaiting.length];
			if (room?.join(player)) {
				return true;
			}
		}
		return false;
	}

	private async queueModeForm(player: Player): Promise<boolean> {
		if (this.rooms.length === 1) {
			return this.rooms[0]?.join(player) ?? false;
		} else {
			return await this.form(player);
		}
	}

	private queueModeInOrder(player: Player): boolean {
		for (let i = 0; i < this.rooms.length; i++) {
			if (this.rooms[i]?.join(player)) {
				return true;
			}
		}
		return false;
	}

	private queueModeRandom(player: Player): boolean {
		const index: number = Math.floor(Math.random() * this.rooms.length);
		const room: Room | undefined = this.rooms[index];
		if (room?.join(player)) {
			return true;
		}
		// Check if the other rooms are available if random room failed for whatever reason
		for (let i = 1; i < this.rooms.length; i++) {
			const current: Room | undefined = this.rooms[(index + i) % this.rooms.length];
			if (current?.join(player)) {
				return true;
			}
		}
		return false;
	}

	private queueModeGameInOrder(player: Player): boolean {
		if (this.joinGameWithPlayersWaiting(player)) {
			return true;
		}
		for (let i = 0; i < this.rooms.length; i++) {
			const room: Room | undefined = this.rooms[i];
			if (room === undefined) {
				continue;
			}
			const game: Game | undefined = Game.get(room.dimensionId);
			if (
				game !== undefined &&
				game.state === GameState.Open &&
				game.players.length < game.maxPlayers &&
				room.join(player)
			) {
				return true;
			}
		}
		return false;
	}

	private queueModeGameRandom(player: Player): boolean {
		if (this.joinGameWithPlayersWaiting(player)) {
			return true;
		}
		const randomIndex: number = Math.floor(Math.random() * this.rooms.length);
		for (let i = 0; i < this.rooms.length; i++) {
			const room: Room | undefined = this.rooms[(randomIndex + i) % this.rooms.length];
			if (room === undefined) {
				continue;
			}
			const game: Game | undefined = Game.get(room.dimensionId);
			if (
				game !== undefined &&
				game.state === GameState.Open &&
				game.players.length < game.maxPlayers &&
				room.join(player)
			) {
				return true;
			}
		}
		return false;
	}

	public async queue(player: Player): Promise<boolean> {
		switch (this.queueMode) {
			case QueueMode.Form: {
				return await this.queueModeForm(player);
			}
			case QueueMode.InOrder: {
				return this.queueModeInOrder(player);
			}
			case QueueMode.Random: {
				return this.queueModeRandom(player);
			}
			case QueueMode.GameInOrder: {
				return this.queueModeGameInOrder(player);
			}
			case QueueMode.GameRandom: {
				return this.queueModeGameRandom(player);
			}
			default:
				return false;
		}
	}

	public async form(player: Player): Promise<boolean> {
		const form = new ActionFormData();
		form.title(`§0${this.displayName} Rooms`);
		for (const room of this.rooms) {
			form.button(room.displayName, room.icon);
		}
		const resp: ActionFormResponse = await safeActionFormShow(form, player);
		if (!player.isValid || resp.selection === undefined) {
			return false;
		}
		const selectedRoom: Room | undefined = this.rooms[resp.selection];
		if (selectedRoom === undefined) {
			player.sendMessage("§cUnable to find selected room");
			return false;
		}
		selectedRoom.join(player);
		return true;
	}
}
