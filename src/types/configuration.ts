import type { StageType } from "./stage";

export type DatabaseSchema = {
	name: string;
	entityTypeNames: string[] | null;
};

export type Locales = string[];

export type ProjectSetupData = {
	customerName: string;
	stage: StageType;
	projectName: string;
	caasApiKey: string;
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
