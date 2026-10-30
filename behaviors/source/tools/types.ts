/** biome-ignore-all lint/style/useNamingConvention: Using objects as an enums */
/** biome-ignore-all assist/source/useSortedKeys: Using objects as an enums */

import { type Vector3, world } from "@minecraft/server";

export interface TeleportLocation {
	facing: Vector3;
	pos: Vector3;
}

export function teleportLocationToString(spawn: TeleportLocation): string {
	return `${spawn.pos.x} ${spawn.pos.y} ${spawn.pos.z} (Facing ${spawn.facing.x} ${spawn.facing.y} ${spawn.facing.z})`;
}

export function teleportLocationDefault(): TeleportLocation {
	return {
		facing: { x: 0.5, y: 0, z: 0.5 },
		pos: { x: 0.5, y: 0, z: 0.5 },
	};
}

export const GameState = {
	Resetting: 0,
	Open: 1,
	Full: 2,
	Active: 3,
	Ending: 4,
} as const;
export type GameState = (typeof GameState)[keyof typeof GameState];

export function gameStateToString(state: GameState): string {
	switch (state) {
		case GameState.Resetting:
			return "Resetting";
		case GameState.Open:
			return "Open";
		case GameState.Full:
			return "Full";
		case GameState.Active:
			return "Active";
		case GameState.Ending:
			return "Ending";
		default:
			return "Unknown";
	}
}

export const WaitingRoomState = {
	Closed: 0,
	Open: 1,
	Full: 2,
};
export type WaitingRoomState = (typeof WaitingRoomState)[keyof typeof WaitingRoomState];

export function waitingRoomStateToString(state: WaitingRoomState): string {
	switch (state) {
		case WaitingRoomState.Closed:
			return "Closed";
		case WaitingRoomState.Open:
			return "Open";
		case WaitingRoomState.Full:
			return "Full";
		default:
			return "Unknown";
	}
}

export const TeamDistributionMode = {
	Balanced: 0,
	InOrder: 1,
} as const;
export type TeamDistributionMode = (typeof TeamDistributionMode)[keyof typeof TeamDistributionMode];

export const QueueMode = {
	ShowForm: 0,
	FirstOpenGame: 1,
	FullyRandom: 2,
	FindGameWithPlayersWaiting: 3,
} as const;
export type QueueMode = (typeof QueueMode)[keyof typeof QueueMode];

export const GameJoinResult = {
	Success: 0,
	Failure: 1,
	Spectator: 2,
};
export type GameJoinResult = (typeof GameJoinResult)[keyof typeof GameJoinResult];

export class EventSignal<T> {
	private _callbacks: ((event: T) => void)[];

	public constructor() {
		this._callbacks = [];
	}

	public subscribe(callback: (event: T) => void): void {
		if (!this._callbacks.includes(callback)) {
			this._callbacks.push(callback);
		}
	}

	public unsubscribe(callback: (event: T) => void): void {
		arrRemoveSwap(this._callbacks, callback);
	}

	public triggerEvent(event: T): void {
		for (const callback of this._callbacks) {
			try {
				callback(event);
			} catch (error) {
				if (error instanceof Error) {
					world.sendMessage(
						`§4EventSignal Error:\n§c${error.name} - ${error.message}\n§6${error.stack}`,
					);
				}
			}
		}
	}
}

export function arrRemoveSwap<T>(arr: T[], val: T): boolean {
	const i = arr.indexOf(val);
	if (i === -1) {
		return false;
	}
	const lastValue: T | undefined = arr[arr.length - 1];
	if (lastValue !== undefined) {
		arr[i] = lastValue;
		arr.pop();
	}
	return true;
}

// Removes first index at which callback returns true
// Returns removed value or undefined if no value was removed
export function arrRemoveByCallback<T>(arr: T[], callback: (current: T) => boolean): T | undefined {
	for (let i = 0; i < arr.length; i++) {
		const current: T | undefined = arr[i];
		if (current === undefined) {
			continue;
		}
		if (callback(current)) {
			const lastValue: T | undefined = arr[arr.length - 1];
			if (lastValue !== undefined) {
				arr[i] = lastValue;
				arr.pop();
			}
			return current;
		}
	}
	return undefined;
}
