import type { PlayerInteractWithBlockBeforeEvent } from "@minecraft/server";

export interface BlockInteractionManager {
	dimensionId: string;
	interactableTypeIds: string[] | null;
	playerInteractWithBlock: (event: PlayerInteractWithBlockBeforeEvent) => void;
}

export function getBlockInteractionManager(
	dimensionId: string,
	interactableTypeIds: string[] | null,
): BlockInteractionManager {
	const manager: BlockInteractionManager = {
		dimensionId: dimensionId,
		interactableTypeIds: interactableTypeIds ?? [],
		playerInteractWithBlock: (event: PlayerInteractWithBlockBeforeEvent): void => {
			if (
				!event.player.isValid ||
				event.player.dimension.id !== manager.dimensionId ||
				interactableTypeIds?.includes(event.block.typeId)
			) {
				return;
			}
			event.cancel = true;
		},
	};
	return manager;
}
