import {
	GameMode,
	type Player,
	PlayerPermissionLevel,
	type PlayerSpawnAfterEvent,
	type StartupEvent,
	system,
	world,
} from "@minecraft/server";
import { PACK_NAMESPACE, roomTypeIds } from "../../constants";
import type { Room } from "./room";

system.beforeEvents.startup.subscribe((event: StartupEvent) => {
	for (const type of roomTypes) {
		for (const room of type.rooms) {
			room.registerDimension(event.dimensionRegistry);
		}
	}
});

world.afterEvents.worldLoad.subscribe(() => {
	const hubRoomType: RoomType | undefined = roomTypeGet(roomTypeIds.hub);
	if (hubRoomType === undefined) {
		return;
	}
	for (const p of world.getAllPlayers()) {
		if (
			p.playerPermissionLevel === PlayerPermissionLevel.Operator &&
			p.getGameMode() === GameMode.Creative
		) {
			continue;
		}
		roomTypeJoin(p, hubRoomType);
	}
});

world.afterEvents.playerSpawn.subscribe((event: PlayerSpawnAfterEvent) => {
	if (!event.initialSpawn) {
		return;
	}
	const hubRoomType: RoomType | undefined = roomTypeGet(roomTypeIds.hub);
	if (hubRoomType !== undefined) {
		roomTypeJoin(event.player, hubRoomType);
	}
});

export type RoomCreatorFunc = (dimensionId: string, displayName: string, icon: string) => Room;

export interface RoomTypeConfig {
	defaultDimensionId: string;
	displayName: string;
	icon?: string;
	roomCount: number;
	roomCreatorFunc: RoomCreatorFunc;
	typeId: string;
}

export interface RoomType {
	displayName: string;
	icon: string;
	readonly rooms: Room[];
	typeId: string;
}

export const roomTypes: RoomType[] = [];

export function roomTypeGet(typeId: string): RoomType | undefined {
	return roomTypes.find((t) => t.typeId === typeId);
}

export function roomTypeInit(config: RoomTypeConfig): RoomType {
	const type: RoomType = {
		displayName: config.displayName,
		icon: config.icon ?? "",
		rooms: [],
		typeId: config.typeId,
	};
	roomTypes.push(type);
	if (config.roomCount < 1) {
		return type;
	}
	if (!config.defaultDimensionId.startsWith("minecraft:")) {
		for (let i = 0; i < config.roomCount; i++) {
			type.rooms.push(
				config.roomCreatorFunc(
					`${config.defaultDimensionId}-${i + 1}`,
					`${type.displayName} ${i + 1}`,
					type.icon,
				),
			);
		}
		return type;
	}
	type.rooms.push(
		config.roomCreatorFunc(config.defaultDimensionId, `${type.displayName} 1`, type.icon),
	);
	if (config.roomCount === 1) {
		return type;
	}
	const colonIndex: number = config.defaultDimensionId.indexOf(":");
	const customDimensionId: string = `${PACK_NAMESPACE}:${config.defaultDimensionId.slice(colonIndex + 1)}`;
	for (let i = 1; i < config.roomCount; i++) {
		type.rooms.push(
			config.roomCreatorFunc(
				`${customDimensionId}-${i + 1}`,
				`${type.displayName} ${i + 1}`,
				type.icon,
			),
		);
	}
	return type;
}

export function roomTypeJoin(player: Player, type: RoomType, roomIndex = 0): boolean {
	const room: Room | undefined = type.rooms[roomIndex];
	return room?.join(player) ?? false;
}
