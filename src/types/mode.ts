export const modeTypes = ["preview", "release"] as const;

export type ModeType = (typeof modeTypes)[number];

export const modeOptionTexts: Record<ModeType, string> = {
	preview: "Preview",
	release: "Release",
} as const;
