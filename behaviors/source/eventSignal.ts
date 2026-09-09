import type { Player } from "@minecraft/server";

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
