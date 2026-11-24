export const stageTypes = ["dev", "qa", "prod"] as const;

export type StageType = (typeof stageTypes)[number];

export const stageOptionTexts: Record<StageType, string> = {
	dev: "Dev",
	qa: "QA",
	prod: "Prod",
} as const;

export const stageColors: Record<StageType, string> = {
	dev: "bg-green-400/10 text-green-500 inset-ring-green-500/20",
	qa: "bg-orange-400/10 text-orange-500 inset-ring-orange-500/20",
	prod: "bg-red-400/10 text-red-500 inset-ring-red-500/20",
} as const;
