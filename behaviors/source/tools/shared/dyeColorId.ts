/** biome-ignore-all lint/style/useNamingConvention: enum style */
/** biome-ignore-all assist/source/useSortedKeys: enum style */
export const DyeColorId = {
	White: "white",
	Orange: "orange",
	Magenta: "magenta",
	LightBlue: "light_blue",
	Yellow: "yellow",
	Lime: "lime",
	Pink: "pink",
	Gray: "gray",
	LightGray: "light_gray",
	Cyan: "cyan",
	Purple: "purple",
	Blue: "blue",
	Brown: "brown",
	Green: "green",
	Red: "red",
	Black: "black",
} as const;
export type DyeColorId = (typeof DyeColorId)[keyof typeof DyeColorId];
