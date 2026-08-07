import { world } from "@minecraft/server";
import { kits } from "../../kits/kitManager";
import roomTypeIds from "../../roomTypeIds";
import { getKitArcher } from "./kits/archer";
import { getKitBlaze } from "./kits/blaze";
import { getKitBreeze } from "./kits/breeze";
import { getKitFisherman } from "./kits/fisherman";
import { getKitLancer } from "./kits/lancer";
import { getKitPoseidon } from "./kits/poseidon";
import { getKitRabbit } from "./kits/rabbit";
import { getKitSnowman } from "./kits/snowman";

world.afterEvents.worldLoad.subscribe(() => {
	kits.set(roomTypeIds.kitPvp, [
		getKitBlaze(),
		getKitBreeze(),
		getKitSnowman(),
		getKitFisherman(),
		getKitPoseidon(),
		getKitRabbit(),
		getKitArcher(),
		getKitLancer(),
	]);
});
