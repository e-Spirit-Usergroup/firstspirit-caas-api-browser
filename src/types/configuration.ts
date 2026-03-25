export type DatabaseSchema = {
	name: string;
	entityTypeNames: string[] | null;
};

export type Locales = string[];

export type Stage = "dev" | "qa" | "prod";

export type ProjectSetupData = {
	customerName: string | null;
	stage: Stage | null;
	projectName: string | null;
	caasApiKey: string | null;
	caasUrl: string | null;
};
