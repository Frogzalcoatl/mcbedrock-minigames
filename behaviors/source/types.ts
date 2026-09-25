/** biome-ignore-all lint/style/useNamingConvention: Using objects as an enums */
/** biome-ignore-all assist/source/useSortedKeys: Using objects as an enums */

import { type Player, type Vector3, world } from "@minecraft/server";

export interface TeleportLocation {
	facing: Vector3;
	pos: Vector3;
}

export function teleportLocationToString(spawn: TeleportLocation): string {
	return `${spawn.pos.x} ${spawn.pos.y} ${spawn.pos.z} (Facing ${spawn.facing.x} ${spawn.facing.y} ${spawn.facing.z})`;
}

export const GameState = {
	Resetting: 0,
	Starting: 1,
	Active: 2,
	Ending: 3,
} as const;
export type GameState = (typeof GameState)[keyof typeof GameState];

export const TeamDistributionMode = {
	Balanced: 0,
	InOrder: 1,
} as const;
export type TeamDistributionMode = (typeof TeamDistributionMode)[keyof typeof TeamDistributionMode];

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
						`§cError occured during event: ${error.name} - ${error.message}\n\n§6${error.stack}`,
					);
				}
			}
		}
	}
}

export interface PlayerEvent {
	player: Player;
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
