import { PACK_NAMESPACE } from "../constants";
import type { Room, RoomCreationFunc } from "./room";

export interface RoomType {
	displayName: string;
	icon: string; // server-ui icon
	rooms: Room[];
	typeId: string;
}

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
	if (config.defaultDimensionId.startsWith("minecraft:") === false) {
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
	let customDimensionId: string = "";
	const namespaceColonIndex: number = config.defaultDimensionId.indexOf(":");
	if (namespaceColonIndex !== -1) {
		customDimensionId = `${PACK_NAMESPACE}:${config.defaultDimensionId.slice(namespaceColonIndex + 1)}`;
	} else {
		customDimensionId = `${PACK_NAMESPACE}:${config.defaultDimensionId}`;
	}
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
