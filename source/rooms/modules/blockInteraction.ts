import {
	GameMode,
	type PlayerInteractWithBlockAfterEvent,
	type PlayerInteractWithBlockBeforeEvent,
	PlayerPermissionLevel,
	world,
} from "@minecraft/server";

function defaultBeforeEvent(event: PlayerInteractWithBlockBeforeEvent): void {
	if (
		event.player.playerPermissionLevel === PlayerPermissionLevel.Operator &&
		event.player.getGameMode() === GameMode.Creative
	) {
		return;
	}
	event.cancel = true;
}

export function initBlockInteractionManager(
	dimensionId: string,
	beforeEvent: ((event: PlayerInteractWithBlockBeforeEvent) => void) | "default" | undefined,
	afterEvent: ((event: PlayerInteractWithBlockAfterEvent) => void) | undefined,
): void {
	if (beforeEvent === "default") {
		beforeEvent = defaultBeforeEvent;
	}
	if (beforeEvent !== undefined) {
		world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
			if (event.player.dimension.id !== dimensionId) {
				return;
			}
			beforeEvent(event);
		});
	}
	if (afterEvent !== undefined) {
		world.afterEvents.playerInteractWithBlock.subscribe((event) => {
			if (event.player.dimension.id !== dimensionId) {
				return;
			}
			afterEvent(event);
		});
	}
}
