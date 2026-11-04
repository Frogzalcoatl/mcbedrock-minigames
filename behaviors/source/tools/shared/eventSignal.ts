import { world } from "@minecraft/server";
import { arrRemoveSwap } from "./arrayHelpers";

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
