import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeCaasUrlForStorage } from "@/lib/caas-url";
import type { StageType } from "@/types/stage";
import type {
	ActiveProjectSelection,
	CustomerConfig,
	DatabaseSchema,
	ProjectConfig,
	ProjectSetupData,
} from "../types/configuration";

const createEmptyStages = (): CustomerConfig["stages"] => ({
	dev: [],
	qa: [],
	prod: [],
});

const ensureSelection = (
	customers: CustomerConfig[],
	selection: ActiveProjectSelection | null,
): ActiveProjectSelection | null => {
	if (!customers.length) {
		return null;
	}
	if (selection) {
		const customer = customers.find(
			(item) => item.customerName === selection.customerName,
		);
		if (customer) {
			const stageProjects = customer.stages[selection.stage];
			const project = stageProjects.find(
				(item) => item.projectName === selection.projectName,
			);
			if (project) {
				return selection;
			}
		}
	}
	for (const customer of customers) {
		for (const stage of ["dev", "qa", "prod"] as StageType[]) {
			const [project] = customer.stages[stage];
			if (project) {
				return {
					customerName: customer.customerName,
					stage,
					projectName: project.projectName,
				};
			}
		}
	}
	return null;
};

const firstSelectionForCustomer = (
	customers: CustomerConfig[],
	customerName: string,
): ActiveProjectSelection | null => {
	const customer = customers.find((item) => item.customerName === customerName);
	if (!customer) {
		return null;
	}
	for (const stage of ["dev", "qa", "prod"] as StageType[]) {
		const [project] = customer.stages[stage];
		if (project) {
			return {
				customerName,
				stage,
				projectName: project.projectName,
			};
		}
	}
	return null;
};

const firstSelectionForCustomerStage = (
	customers: CustomerConfig[],
	customerName: string,
	stage: StageType,
): ActiveProjectSelection | null => {
	const customer = customers.find((item) => item.customerName === customerName);
	if (!customer) {
		return null;
	}
	const [project] = customer.stages[stage];
	if (!project) {
		return null;
	}
	return {
		customerName,
		stage,
		projectName: project.projectName,
	};
};

export const getActiveProjectFromState = (state: {
	customers: CustomerConfig[];
	activeSelection: ActiveProjectSelection | null;
}): ProjectConfig | null => {
	if (!state.activeSelection) {
		return null;
	}
	const customer = state.customers.find(
		(item) => item.customerName === state.activeSelection?.customerName,
	);
	if (!customer) {
		return null;
	}
	const stageProjects = customer.stages[state.activeSelection.stage];
	return (
		stageProjects.find(
			(item) => item.projectName === state.activeSelection?.projectName,
		) ?? null
	);
};

const normalizeProjectConfigUrl = (project: ProjectConfig): ProjectConfig => ({
	...project,
	caasUrl: normalizeCaasUrlForStorage(project.caasUrl),
});

const normalizeCustomers = (customers: CustomerConfig[]): CustomerConfig[] =>
	customers.map((customer) => ({
		...customer,
		stages: {
			dev: customer.stages.dev.map(normalizeProjectConfigUrl),
			qa: customer.stages.qa.map(normalizeProjectConfigUrl),
			prod: customer.stages.prod.map(normalizeProjectConfigUrl),
		},
	}));

export type CaaSConfigStore = {
	customers: CustomerConfig[];
	activeSelection: ActiveProjectSelection | null;
	wizardProjectSetupData: ProjectSetupData | null;
	wizardDatabaseSchemas: DatabaseSchema[];
	setConfigData: (
		customers: CustomerConfig[],
		activeSelection?: ActiveProjectSelection | null,
	) => void;
	upsertProjectSetupData: (projectSetupData: ProjectSetupData) => void;
	setWizardProjectSetupData: (projectSetupData: ProjectSetupData) => void;
	setWizardDatabaseSchemas: (schemas: DatabaseSchema[]) => void;
	clearWizardDraft: () => void;
	setActiveCustomer: (customerName: string) => void;
	setActiveStage: (stage: StageType) => void;
	setActiveProject: (projectName: string) => void;
	setActiveProjectDatabaseSchemas: (schemas: DatabaseSchema[]) => void;
	setActiveProjectLocales: (locales: string[]) => void;
	removeProject: (project: {
		customerName: string;
		stage: StageType;
		projectName: string;
	}) => void;
	clearStore: () => void;
};

export const useCaaSConfigStore = create<CaaSConfigStore>()(
	persist(
		(set) => ({
			customers: [],
			activeSelection: null,
			wizardProjectSetupData: null,
			wizardDatabaseSchemas: [],
			setConfigData: (customers, activeSelection = null) => {
				const normalizedCustomers = normalizeCustomers(customers);
				set({
					customers: normalizedCustomers,
					activeSelection: ensureSelection(normalizedCustomers, activeSelection),
				});
			},
			upsertProjectSetupData: (projectSetupData) =>
				set((state) => {
					const customers = [...state.customers];
					const customerName = projectSetupData.customerName.trim();
					const projectName = projectSetupData.projectName.trim();
					const customerIndex = customers.findIndex(
						(item) => item.customerName === customerName,
					);
					const nextCustomer =
						customerIndex >= 0
							? { ...customers[customerIndex] }
							: { customerName, stages: createEmptyStages() };
					const stage = projectSetupData.stage;
					const nextStageProjects = [...nextCustomer.stages[stage]];
					const existingProjectIndex = nextStageProjects.findIndex(
						(item) => item.projectName === projectName,
					);
					const previousProject = nextStageProjects[existingProjectIndex];
					const nextProject: ProjectConfig = {
						customerName,
						stage,
						projectName,
						caasApiKey: projectSetupData.caasApiKey,
						caasUrl: normalizeCaasUrlForStorage(projectSetupData.caasUrl),
						databaseSchemas: previousProject?.databaseSchemas ?? null,
						locales: previousProject?.locales ?? [],
					};
					if (existingProjectIndex >= 0) {
						nextStageProjects[existingProjectIndex] = nextProject;
					} else {
						nextStageProjects.push(nextProject);
					}
					nextCustomer.stages = {
						...nextCustomer.stages,
						[stage]: nextStageProjects,
					};
					if (customerIndex >= 0) {
						customers[customerIndex] = nextCustomer;
					} else {
						customers.push(nextCustomer);
					}
					return {
						customers,
						activeSelection: ensureSelection(customers, {
							customerName,
							stage,
							projectName,
						}),
					};
				}),
			setWizardProjectSetupData: (projectSetupData) =>
				set({
					wizardProjectSetupData: {
						...projectSetupData,
						customerName: projectSetupData.customerName.trim(),
						projectName: projectSetupData.projectName.trim(),
						caasUrl: normalizeCaasUrlForStorage(projectSetupData.caasUrl),
					},
				}),
			setWizardDatabaseSchemas: (wizardDatabaseSchemas) =>
				set({
					wizardDatabaseSchemas,
				}),
			clearWizardDraft: () =>
				set({
					wizardProjectSetupData: null,
					wizardDatabaseSchemas: [],
				}),
			setActiveCustomer: (customerName) =>
				set((state) => {
					const nextSelection = firstSelectionForCustomer(
						state.customers,
						customerName,
					);
					if (!nextSelection) {
						return state;
					}
					return {
						...state,
						activeSelection: nextSelection,
					};
				}),
			setActiveStage: (stage) =>
				set((state) => {
					if (!state.activeSelection) {
						return state;
					}
					const nextSelection = firstSelectionForCustomerStage(
						state.customers,
						state.activeSelection.customerName,
						stage,
					);
					if (!nextSelection) {
						return state;
					}
					return {
						...state,
						activeSelection: nextSelection,
					};
				}),
			setActiveProject: (projectName) =>
				set((state) => {
					if (!state.activeSelection) {
						return state;
					}
					const nextSelection = ensureSelection(state.customers, {
						customerName: state.activeSelection.customerName,
						stage: state.activeSelection.stage,
						projectName,
					});
					return {
						...state,
						activeSelection: nextSelection,
					};
				}),
			setActiveProjectDatabaseSchemas: (databaseSchemas) =>
				set((state) => {
					if (!state.activeSelection) {
						return state;
					}
					const customers = state.customers.map((customer) => {
						if (customer.customerName !== state.activeSelection?.customerName) {
							return customer;
						}
						const stage = state.activeSelection.stage;
						const stageProjects = customer.stages[stage].map((project) =>
							project.projectName === state.activeSelection?.projectName
								? { ...project, databaseSchemas }
								: project,
						);
						return {
							...customer,
							stages: {
								...customer.stages,
								[stage]: stageProjects,
							},
						};
					});
					return { ...state, customers };
				}),
			setActiveProjectLocales: (locales) =>
				set((state) => {
					if (!state.activeSelection) {
						return state;
					}
					const customers = state.customers.map((customer) => {
						if (customer.customerName !== state.activeSelection?.customerName) {
							return customer;
						}
						const stage = state.activeSelection.stage;
						const stageProjects = customer.stages[stage].map((project) =>
							project.projectName === state.activeSelection?.projectName
								? { ...project, locales }
								: project,
						);
						return {
							...customer,
							stages: {
								...customer.stages,
								[stage]: stageProjects,
							},
						};
					});
					return { ...state, customers };
				}),
			removeProject: ({ customerName, stage, projectName }) =>
				set((state) => {
					const customerIndex = state.customers.findIndex(
						(customer) => customer.customerName === customerName,
					);
					if (customerIndex < 0) {
						return state;
					}

					const customer = state.customers[customerIndex];
					const stageProjects = customer.stages[stage];
					const nextStageProjects = stageProjects.filter(
						(project) => project.projectName !== projectName,
					);

					if (nextStageProjects.length === stageProjects.length) {
						return state;
					}

					const nextCustomer: CustomerConfig = {
						...customer,
						stages: {
							...customer.stages,
							[stage]: nextStageProjects,
						},
					};
					const customers = [...state.customers];
					customers[customerIndex] = nextCustomer;

					return {
						...state,
						customers,
						activeSelection: ensureSelection(customers, state.activeSelection),
					};
				}),
			clearStore: () =>
				set({
					customers: [],
					activeSelection: null,
					wizardProjectSetupData: null,
					wizardDatabaseSchemas: [],
				}),
		}),
		{
			name: "caas-config-store",
			version: 4,
			partialize: (state) => ({
				customers: state.customers,
				activeSelection: state.activeSelection,
			}),
			migrate: (persistedState) => {
				if (!persistedState || typeof persistedState !== "object") {
					return persistedState;
				}
				const state = persistedState as {
					customers?: CustomerConfig[];
					activeSelection?: ActiveProjectSelection | null;
				};
				if (!Array.isArray(state.customers)) {
					return persistedState;
				}
				return {
					...state,
					customers: normalizeCustomers(state.customers),
				};
			},
		},
	),
);

export const getActiveProjectConfig = (): ProjectConfig | null =>
	getActiveProjectFromState(useCaaSConfigStore.getState());

export const isCaaSConfigStoreInitialized = (): boolean => {
	const store = useCaaSConfigStore.getState();
	const activeProject = getActiveProjectFromState(store);

	return !!(
		activeProject?.customerName &&
		activeProject?.stage &&
		activeProject?.projectName &&
		activeProject?.caasApiKey &&
		activeProject?.caasUrl &&
		activeProject?.locales?.length
	);
};
