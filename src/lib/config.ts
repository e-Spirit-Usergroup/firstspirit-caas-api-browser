import type { DatabaseSchema, ProjectSetupData } from "../types/configuration";

export const SaveConfigToJson = ({
	projectSettings,
	databaseSchemas,
	locales,
}: {
	projectSettings: ProjectSetupData;
	databaseSchemas: DatabaseSchema[] | null;
	locales: string[] | null;
}): boolean => {
	const json = JSON.stringify(
		{ projectSettings, databaseSchemas, locales },
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
	const customerName = projectSettings.customerName?.trim().toUpperCase() || "";
	const stage = projectSettings.stage?.toUpperCase() || "";
	const projectName = projectSettings.projectName?.trim() || "project";
	const fileNamePrefix =
		customerName && stage
			? `${customerName}_${stage}_${projectName}`
			: projectName;

	downloadAnchorNode.setAttribute("href", dataStr);
	downloadAnchorNode.setAttribute(
		"download",
		"export_" + fileNamePrefix + "_" + formattedDate + ".json",
	);
	document.body.appendChild(downloadAnchorNode); // required for firefox
	downloadAnchorNode.click();
	downloadAnchorNode.remove();

	return true;
};
