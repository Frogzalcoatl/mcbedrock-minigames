import type { TickingAreaOptions } from "@minecraft/server";

export interface TickingAreaJob {
	callback: () => void;
	durationTicks: number;
	tickingArea: TickingAreaOptions;
}

export class TickingAreaQueue {
	private _queue: TickingAreaJob[];

	public constructor() {
		this._queue = [];
	}

	public queueJob(job: TickingAreaJob): void {
		this._queue.push(job);
		this.update();
	}

	private update(): void {}
}
export const tickingAreaQueue = new TickingAreaQueue();
