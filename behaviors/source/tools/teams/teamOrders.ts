import { ColorCode } from "../shared/colorCodes";
import { DyeColorId } from "../shared/dyeColorId";
import { Team } from "./team";

interface TeamOrdersValue {
	colorCode: ColorCode;
	dyeColor: DyeColorId;
	name: string;
}

const teamOrders: TeamOrdersValue[] = [
	{ colorCode: ColorCode.Red, dyeColor: DyeColorId.Red, name: "Red" },
	{ colorCode: ColorCode.DarkBlue, dyeColor: DyeColorId.Blue, name: "Blue" },
	{ colorCode: ColorCode.Green, dyeColor: DyeColorId.Lime, name: "Green" },
	{ colorCode: ColorCode.Yellow, dyeColor: DyeColorId.Yellow, name: "Yellow" },
	{ colorCode: ColorCode.DarkAqua, dyeColor: DyeColorId.Cyan, name: "Aqua" },
	{ colorCode: ColorCode.White, dyeColor: DyeColorId.White, name: "White" },
	{ colorCode: ColorCode.LightPurple, dyeColor: DyeColorId.Pink, name: "Pink" },
	{ colorCode: ColorCode.DarkGray, dyeColor: DyeColorId.Gray, name: "Gray" },
];

export function getDefaultTeamOrders(teamCount: number, playersPerTeam: number): Team[] {
	const teams: Team[] = [];
	let teamsAdded = 0;
	const maxI: number = Math.min(teamCount, teamOrders.length);
	for (let i = 0; i < maxI; i++) {
		const current: TeamOrdersValue | undefined = teamOrders[i];
		if (current !== undefined) {
			const team = new Team(current.name, playersPerTeam);
			team.colorCode = current.colorCode;
			team.dyeColor = current.dyeColor;
			teams.push(team);
			teamsAdded++;
		}
	}
	if (teamsAdded < teamCount) {
		const remaining: number = teamCount - teamsAdded;
		for (let i = 1; i <= remaining; i++) {
			teams.push(new Team(`Extra-${i}`, playersPerTeam));
		}
	}
	return teams;
}
