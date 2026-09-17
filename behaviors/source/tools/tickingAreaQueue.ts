import { type TickingAreaOptions, world } from "@minecraft/server";

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

	public queueJob(job: TickingAreaJob): void {}
}
export const tickingAreaQueue = new TickingAreaQueue();
