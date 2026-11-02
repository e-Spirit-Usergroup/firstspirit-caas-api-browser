import type { ModeType } from "./mode";
import type { StageType } from "./stage";

export type DatabaseSchema = {
	name: string;
	entityTypeNames: string[] | null;
};

export type Locales = string[];

/** CaaS API keys per mode; at least one is set for a configured project. */
export type CaasApiKeys = Partial<Record<ModeType, string>>;

export type ProjectSetupData = {
	customerName: string;
	stage: StageType;
	projectName: string;
	caasApiKeys: CaasApiKeys;
	caasUrl: string;
};

export type ProjectConfig = ProjectSetupData & {
	databaseSchemas: DatabaseSchema[] | null;
	locales: Locales;
};

export type StageProjects = Record<StageType, ProjectConfig[]>;

export type CustomerConfig = {
	customerName: string;
	stages: StageProjects;
};

export type ActiveProjectSelection = {
	customerName: string;
	stage: StageType;
	projectName: string;
};
