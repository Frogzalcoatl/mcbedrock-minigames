import { system, world } from "@minecraft/server";
import type { Room, RoomCreationFunc } from "../room";

export interface RoomType {
	displayName: string;
	rooms: Room[];
	typeId: string;
}

interface RoomTypeConfig {
	roomTypeIndex: number;
	typeId: string;
	displayName: string;
	defaultDimensionId: string;
	roomCreationFunc: RoomCreationFunc;
	roomCount: number;
}

export function initRoomType(config: RoomTypeConfig): RoomType {
	const type: RoomType = {
		displayName: config.displayName,
		rooms: [],
		typeId: config.typeId,
	};
	if (config.defaultDimensionId.startsWith("minecraft:")) {
		if (config.roomCount > 1) {
			system.run(() => {
				world.sendMessage(
					"§6Cannot initialize multiple room instances when default dimension id is set to a vanilla dimension.",
				);
				world.sendMessage(
					`§7Only initializing one instance of "${config.typeId}" with dimension id "${config.defaultDimensionId}".`,
				);
			});
		}
		type.rooms.push(
			config.roomCreationFunc(
				config.roomTypeIndex,
				0,
				config.defaultDimensionId,
				`${config.displayName}`,
			),
		);
	} else {
		for (let i: number = 0; i < config.roomCount; i++) {
			type.rooms.push(
				config.roomCreationFunc(
					config.roomTypeIndex,
					i,
					`${config.defaultDimensionId}-${i + 1}`,
					`${type.displayName}${i > 0 ? ` ${i + 1}` : ""}`,
				),
			);
		}
	}
	return type;
}
