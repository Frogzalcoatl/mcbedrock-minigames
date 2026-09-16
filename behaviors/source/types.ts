import type { Player, Vector3 } from "@minecraft/server";

export interface TeleportLocation {
	facing: Vector3;
	pos: Vector3;
}

export function teleportLocationToString(spawn: TeleportLocation): string {
	return `${spawn.pos.x} ${spawn.pos.y} ${spawn.pos.z} (Facing ${spawn.facing.x} ${spawn.facing.y} ${spawn.facing.z})`;
}

export class EventSignal<T> {
	private _callbacks: Set<(event: T) => void>;

	public constructor() {
		this._callbacks = new Set<(event: T) => void>();
	}

	public subscribe(callback: (event: T) => void): void {
		this._callbacks.add(callback);
	}

	public unsubscribe(callback: (event: T) => void): void {
		this._callbacks.delete(callback);
	}

	public triggerEvent(event: T): void {
		for (const callback of this._callbacks) {
			callback(event);
		}
	}
}

export interface PlayerEvent {
	player: Player;
}
