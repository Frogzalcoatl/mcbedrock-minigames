import { type Player, system } from "@minecraft/server";

const portalSoundMap = new Map<string, number>(); // [playerId, runId]

export function portalSoundRunIntervalClear(player: Player): void {
	const oldRunId: number | undefined = portalSoundMap.get(player.id);
	if (oldRunId !== undefined) {
		system.clearRun(oldRunId);
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
