import { PACK_NAMESPACE } from "../constants";
import type { Room } from "./room";

export interface RoomType {
	displayName: string;
	icon: string; // server-ui icon
	rooms: Room[];
	typeId: string;
}

export type RoomCreationFunc = (
	roomTypeIndex: number,
	roomIndex: number,
	dimensionId: string,
	displayName: string,
	icon: string,
) => Room;

interface RoomTypeConfig {
	roomTypeIndex: number;
	typeId: string;
	displayName: string;
	icon?: string;
	defaultDimensionId: string;
	roomCreationFunc: RoomCreationFunc;
	roomCount: number;
}

export function initRoomType(config: RoomTypeConfig): RoomType {
	const type: RoomType = {
		displayName: config.displayName,
		icon: config.icon ?? "",
		rooms: [],
		typeId: config.typeId,
	};
	if (config.roomCount < 1) {
		return type;
	}
	if (!config.defaultDimensionId.startsWith("minecraft:")) {
		for (let i: number = 0; i < config.roomCount; i++) {
			type.rooms.push(
				config.roomCreationFunc(
					config.roomTypeIndex,
					i,
					`${config.defaultDimensionId}-${i + 1}`,
					`${type.displayName} ${i + 1}`,
					config.icon ?? "",
				),
			);
		}
		return type;
	}
	type.rooms.push(
		config.roomCreationFunc(
			config.roomTypeIndex,
			0,
			config.defaultDimensionId,
			`${config.displayName} 1`,
			config.icon ?? "",
		),
	);
	if (config.roomCount === 1) {
		return type;
	}
	const namespaceColonIndex: number = config.defaultDimensionId.indexOf(":");
	const customDimensionId = `${PACK_NAMESPACE}:${config.defaultDimensionId.slice(namespaceColonIndex + 1)}`;
	for (let i: number = 1; i < config.roomCount; i++) {
		type.rooms.push(
			config.roomCreationFunc(
				config.roomTypeIndex,
				i,
				`${customDimensionId}-${i + 1}`,
				`${type.displayName} ${i + 1}`,
				config.icon ?? "",
			),
		);
	}
	return type;
}
