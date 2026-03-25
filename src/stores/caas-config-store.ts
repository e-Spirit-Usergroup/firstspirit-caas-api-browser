import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DatabaseSchema, ProjectSetupData } from "../types/configuration";

export type CaaSConfigStore = {
	projectSetupData: ProjectSetupData;
	setProjectSetupData: (projectSetupData: ProjectSetupData) => void;
	databaseSchemas: DatabaseSchema[] | null;
	setDatabaseSchemas: (schemas: DatabaseSchema[]) => void;
	locales: string[];
	setLocales: (locales: string[]) => void;
	clearStore: () => void;
};

export const useCaaSConfigStore = create<CaaSConfigStore>()(
	persist(
		(set) => ({
			projectSetupData: {
				customerName: null,
				stage: null,
				projectName: null,
				caasApiKey: null,
				caasUrl: null,
			},
			setProjectSetupData: (projectSetupData) =>
				set({ projectSetupData: projectSetupData }),
			databaseSchemas: null,
			setDatabaseSchemas: (databaseSchemas) => set({ databaseSchemas }),
			locales: [],
			setLocales: (locales) => set({ locales }),
			clearStore: () =>
				set({
					projectSetupData: {
						customerName: null,
						stage: null,
						projectName: null,
						caasApiKey: null,
						caasUrl: null,
					},
					databaseSchemas: null,
					locales: [],
				}),
		}),
		{
			name: "caas-config-store",
			version: 1.1,
		},
	),
);

export const isCaaSConfigStoreInitialized = (): boolean => {
	const store = useCaaSConfigStore.getState();
	const { projectSetupData, locales } = store;

	return !!(
		projectSetupData.customerName &&
		projectSetupData.stage &&
		projectSetupData.projectName &&
		projectSetupData.caasApiKey &&
		projectSetupData.caasUrl &&
		// databaseSchemas &&
		// databaseSchemas.length > 0 &&
		locales &&
		locales.length > 0
	);
};
