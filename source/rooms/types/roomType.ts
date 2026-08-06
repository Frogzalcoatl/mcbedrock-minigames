import { system, world } from "@minecraft/server";
import type { Room, RoomCreationFunc } from "../room";

export interface RoomType {
	typeName: string;
	rooms: Room[];
}

export function initRoomType(
	typeName: string,
	defaultDimensionId: string,
	roomCreationFunc: RoomCreationFunc,
	roomCount: number,
): RoomType {
	const type: RoomType = {
		rooms: [],
		typeName: typeName,
	};
	if (defaultDimensionId.startsWith("minecraft:")) {
		if (roomCount > 1) {
			system.run(() => {
				world.sendMessage(
					"§6Cannot initialize multiple room instances when default dimension id is set to a vanilla dimension.",
				);
				world.sendMessage(
					`§7Only initializing one instance of "${typeName}" with dimension id "${defaultDimensionId}".`,
				);
			});
		}
		type.rooms.push(roomCreationFunc(0, defaultDimensionId, `${typeName}`));
	} else {
		for (let i: number = 0; i < roomCount; i++) {
			type.rooms.push(
				roomCreationFunc(
					i,
					`${defaultDimensionId}-${i + 1}`,
					`${type.typeName}${i > 0 ? ` ${i + 1}` : ""}`,
				),
			);
		}
	}
	return type;
}
