export const stageTypes = ["dev", "qa", "prod"] as const;

export type StageType = (typeof stageTypes)[number];

export const stageOptionTexts: Record<StageType, string> = {
	dev: "Dev",
	qa: "QA",
	prod: "Prod",
} as const;
