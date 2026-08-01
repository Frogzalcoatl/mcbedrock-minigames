import {
	CommandPermissionLevel,
	type Container,
	type CustomCommand,
	type CustomCommandOrigin,
	type CustomCommandResult,
	CustomCommandStatus,
	type Dimension,
	EntityComponentTypes,
	type EntityInventoryComponent,
	ItemLockMode,
	ItemStack,
	Player,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import { ActionFormData, type ActionFormResponse } from "@minecraft/server-ui";
import { MinecraftDimensionTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";

const PackNamespace: string = "mg"; // MiniGames (mg)
const TestDimensionId: string = `${PackNamespace}:test`;

const DimensionCommand: CustomCommand = {
	description: "Transfer to another dimension.",
	name: `${PackNamespace}:dih`,
	permissionLevel: CommandPermissionLevel.Admin,
};

function dimensionCommandCallback(origin: CustomCommandOrigin): CustomCommandResult {
	let player: Player | undefined;
	if (origin.initiator !== undefined && origin.initiator instanceof Player) {
		player = origin.initiator;
	} else if (origin.sourceEntity !== undefined && origin.sourceEntity instanceof Player) {
		player = origin.sourceEntity;
	}
	if (player === undefined || !player.isValid) {
		return {
			message: "§cNo valid player for ui",
			status: CustomCommandStatus.Failure,
		};
	}
	system.run(() => {
		showDimensionNavForm(player);
	});
	return { status: CustomCommandStatus.Success };
}

system.beforeEvents.startup.subscribe((e) => {
	e.dimensionRegistry.registerCustomDimension(TestDimensionId);
	e.customCommandRegistry.registerCommand(DimensionCommand, dimensionCommandCallback);
});

let NavItem: ItemStack;
system.run(() => {
	NavItem = new ItemStack(MinecraftItemTypes.Compass);
	NavItem.nameTag = "§r§dDimension Navigation§r";
	NavItem.lockMode = ItemLockMode.inventory;
});

function giveCompassItem(container: Container): void {
	if (!container.isValid) {
		return;
	}
	try {
		container.addItem(NavItem);
	} catch (error) {
		if (error instanceof Error) {
			world.sendMessage(`§cFailed to give compass item to container: ${error.message}`);
		}
	}
}

world.afterEvents.playerSpawn.subscribe((e) => {
	const inv: EntityInventoryComponent | undefined = e.player.getComponent(
		EntityComponentTypes.Inventory,
	);
	if (inv) {
		giveCompassItem(inv.container);
	}
});

interface DimensionSpawn {
	id: string;
	location: Vector3;
}
const DimensionSpawns: DimensionSpawn[] = [
	{ id: MinecraftDimensionTypes.Overworld, location: { x: 0.5, y: -50, z: 0.5 } },
	{ id: MinecraftDimensionTypes.Nether, location: { x: 0.5, y: 50, z: 0.5 } },
	{ id: MinecraftDimensionTypes.TheEnd, location: { x: 0.5, y: 100.5, z: 0.5 } },
	{ id: TestDimensionId, location: { x: 0.5, y: 0, z: 0.5 } },
];

async function showDimensionNavForm(player: Player): Promise<void> {
	if (!player.isValid) {
		return;
	}
	const form: ActionFormData = new ActionFormData().title("Dimension Navigation");
	for (const d of DimensionSpawns) {
		form.button(d.id);
	}
	const resp: ActionFormResponse = await form.show(player);
	if (
		resp.canceled ||
		resp.selection === undefined ||
		resp.selection >= DimensionSpawns.length ||
		!player.isValid
	) {
		return;
	}
	const dimensionSpawn: DimensionSpawn | undefined = DimensionSpawns[resp.selection];
	if (dimensionSpawn === undefined) {
		return;
	}
	let dimension: Dimension | undefined;
	try {
		dimension = world.getDimension(dimensionSpawn.id);
	} catch (error) {
		if (error instanceof Error) {
			player.sendMessage(
				`§cUnable to navigate to dimension "${dimensionSpawn.id}": ${error.message}`,
			);
		}
	}
	if (dimension === undefined) {
		return;
	}
	player.teleport(dimensionSpawn.location, { dimension: dimension });
}

world.afterEvents.itemUse.subscribe((e) => {
	if (e.itemStack.typeId === NavItem.typeId && e.itemStack.nameTag === NavItem.nameTag) {
		showDimensionNavForm(e.source);
	}
});
