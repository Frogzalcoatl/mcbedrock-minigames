import { GameMode, PlayerPermissionLevel, world } from "@minecraft/server";

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
	if (
		event.player.playerPermissionLevel === PlayerPermissionLevel.Operator &&
		event.player.getGameMode() === GameMode.Creative
	) {
		return;
	}
	event.cancel = true;
});
