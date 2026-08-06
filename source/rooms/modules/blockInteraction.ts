import { GameMode, type PlayerInteractWithBlockBeforeEvent } from "@minecraft/server";

export interface BlockInteractionManager {
	dimensionId: string;
	interactableTypeIds: string[] | null;
	excludeGameModes: GameMode[];
	playerInteractWithBlock: (event: PlayerInteractWithBlockBeforeEvent) => void;
}

export function getBlockInteractionManager(
	dimensionId: string,
	interactableTypeIds: string[] | null,
	excludeGameModes: GameMode[] = [GameMode.Creative],
): BlockInteractionManager {
	const manager: BlockInteractionManager = {
		dimensionId: dimensionId,
		excludeGameModes: excludeGameModes,
		interactableTypeIds: interactableTypeIds ?? [],
		playerInteractWithBlock: (event: PlayerInteractWithBlockBeforeEvent): void => {
			if (
				!event.player.isValid ||
				event.player.dimension.id !== manager.dimensionId ||
				interactableTypeIds?.includes(event.block.typeId) ||
				manager.excludeGameModes.includes(event.player.getGameMode())
			) {
				return;
			}
			event.cancel = true;
		},
	};
	return manager;
}
