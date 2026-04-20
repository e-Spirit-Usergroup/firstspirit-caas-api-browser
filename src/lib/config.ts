import { encryptCaasApiKey } from "./config-crypto";
import type { CustomerConfig } from "../types/configuration";

type ExportConfigPayload = {
	customers: CustomerConfig[];
};

type ExportedProjectConfig = {
	project: string;
	encryptedCaasApiKey: string;
	caasApiUrl: string;
	databaseSchemas: CustomerConfig["stages"]["dev"][number]["databaseSchemas"];
	locales: CustomerConfig["stages"]["dev"][number]["locales"];
};

type ExportedCustomerConfig = {
	customer: string;
	stages: {
		dev: ExportedProjectConfig[];
		qa: ExportedProjectConfig[];
		prod: ExportedProjectConfig[];
	};
};

const toExportedProject = async (
	project: CustomerConfig["stages"]["dev"][number],
	password: string,
): Promise<ExportedProjectConfig> => {
	const encryptedCaasApiKey = await encryptCaasApiKey(project.caasApiKey, password);

	return {
		project: project.projectName,
		encryptedCaasApiKey,
		caasApiUrl: project.caasUrl,
		databaseSchemas: project.databaseSchemas,
		locales: project.locales,
	};
};

const toExportedCustomers = async (
	customers: CustomerConfig[],
	password: string,
): Promise<ExportedCustomerConfig[]> =>
	Promise.all(
		customers.map(async (customer) => ({
			customer: customer.customerName,
			stages: {
				dev: await Promise.all(
					customer.stages.dev.map((project) => toExportedProject(project, password)),
				),
				qa: await Promise.all(
					customer.stages.qa.map((project) => toExportedProject(project, password)),
				),
				prod: await Promise.all(
					customer.stages.prod.map((project) => toExportedProject(project, password)),
				),
			},
		})),
	);

const downloadConfigAsJson = (
	{ customers }: ExportConfigPayload,
	fileNamePrefix: string,
	password: string,
): Promise<boolean> => {
	if (!password.trim()) {
		throw new Error("Password is required for export.");
	}

	const buildAndDownload = async (): Promise<boolean> => {
		const json = JSON.stringify(
			{ version: 2, customers: await toExportedCustomers(customers, password) },
			null,
			2,
		);
		const date = new Date();
		const formattedDate = date
			.toISOString()
			.replace(/:/g, "-")
			.replace(/\..+/, "");

		const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(json)}`;
		const downloadAnchorNode = document.createElement("a");
		const scopedFileNamePrefix = "projects";
		downloadAnchorNode.setAttribute("href", dataStr);
		downloadAnchorNode.setAttribute(
			"download",
			`${fileNamePrefix}_${scopedFileNamePrefix}_${formattedDate}.json`,
		);
		document.body.appendChild(downloadAnchorNode); // required for firefox
		downloadAnchorNode.click();
		downloadAnchorNode.remove();

		return true;
	};

	return buildAndDownload();
};

export const SaveConfigToJson = (
	payload: ExportConfigPayload,
	password: string,
): Promise<boolean> => downloadConfigAsJson(payload, "export", password);

export const SaveSelectedProjectsToJson = (
	payload: ExportConfigPayload,
	password: string,
): Promise<boolean> => downloadConfigAsJson(payload, "export_selected", password);
