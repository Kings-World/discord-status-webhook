export function toTitleCase(str: string) {
	// a minimal version of the one from @sapphire/utilities
	// https://github.com/sapphiredev/utilities/blob/main/packages/utilities/src/lib/toTitleCase.ts
	return str.replace(
		/[A-Za-zÀ-ÖØ-öø-ÿ]\S*/g,
		(txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase(),
	);
}
