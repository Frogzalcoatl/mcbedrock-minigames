import {
	type PlayerInteractWithBlockAfterEvent,
	type PlayerInteractWithBlockBeforeEvent,
	world,
} from "@minecraft/server";

export interface BlockInteractionManager {
	dimensionId: string;
	beforeEvent: ((event: PlayerInteractWithBlockBeforeEvent) => void) | undefined; // dimensionId is checked before running (see below)
	afterEvent: ((event: PlayerInteractWithBlockAfterEvent) => void) | undefined; // dimensionId is checked before running (see below)
	init: () => void;
}

export function getBlockInteractionManager(
	dimensionId: string,
	beforeEvent?: (event: PlayerInteractWithBlockBeforeEvent) => void,
	afterEvent?: (event: PlayerInteractWithBlockAfterEvent) => void,
): BlockInteractionManager {
	const manager: BlockInteractionManager = {
		afterEvent: undefined,
		beforeEvent: undefined,
		dimensionId: dimensionId,
		init: (): void => {
			if (manager.beforeEvent !== undefined) {
				world.beforeEvents.playerInteractWithBlock.subscribe(manager.beforeEvent);
			}
			if (manager.afterEvent !== undefined) {
				world.afterEvents.playerInteractWithBlock.subscribe(manager.afterEvent);
			}
		},
	};
	if (beforeEvent !== undefined) {
		manager.beforeEvent = (event: PlayerInteractWithBlockBeforeEvent): void => {
			if (event.player.dimension.id !== manager.dimensionId) {
				return;
			}
			beforeEvent(event);
		};
	}
	if (afterEvent !== undefined) {
		manager.afterEvent = (event: PlayerInteractWithBlockAfterEvent): void => {
			if (event.player.dimension.id !== manager.dimensionId) {
				return;
			}
			afterEvent(event);
		};
	}
	return manager;
}
