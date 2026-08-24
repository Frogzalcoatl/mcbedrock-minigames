import { type Player, system } from "@minecraft/server";

const portalSoundMap = new Map<string, number>(); // [playerId, runIntervalId]

export function portalSoundRunIntervalClear(player: Player): void {
	const oldIntervalId: number | undefined = portalSoundMap.get(player.id);
	if (oldIntervalId !== undefined) {
		system.clearRun(oldIntervalId);
		portalSoundMap.delete(player.id);
	}
}

export function portalSoundRunInterval(player: Player): void {
	portalSoundRunIntervalClear(player);
	player.clearVelocity();
	const intervalId: number = system.runInterval(() => {
		player.stopSound("portal.travel");
		if (Math.abs(player.getVelocity().x) >= 0.2 || Math.abs(player.getVelocity().z) >= 0.2) {
			system.clearRun(intervalId);
			portalSoundMap.delete(player.id);
		}
	});
	portalSoundMap.set(player.id, intervalId);
}
