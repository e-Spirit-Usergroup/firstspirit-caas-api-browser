export type UpdateCheckResult =
	| { status: "upToDate"; latestVersion: string }
	| { status: "updateAvailable"; latestVersion: string; releaseUrl: string }
	| { status: "error" };

export function normalizeVersion(rawVersion: string): string {
	return rawVersion.trim().replace(/^v/i, "").split("-")[0].split("+")[0];
}

export function compareVersions(leftVersion: string, rightVersion: string): number {
	const leftParts = leftVersion.split(".").map(Number);
	const rightParts = rightVersion.split(".").map(Number);
	const maxLength = Math.max(leftParts.length, rightParts.length);

	for (let index = 0; index < maxLength; index += 1) {
		const leftPart = Number.isFinite(leftParts[index]) ? leftParts[index] : 0;
		const rightPart = Number.isFinite(rightParts[index]) ? rightParts[index] : 0;
		if (leftPart > rightPart) return 1;
		if (leftPart < rightPart) return -1;
	}

	return 0;
}

export async function checkForUpdate(
	currentVersion: string,
	apiUrl: string,
	releasesPageUrl: string,
): Promise<UpdateCheckResult> {
	const response = await fetch(apiUrl);
	if (!response.ok) {
		throw new Error(`Update check failed with status ${response.status}`);
	}

	const release = (await response.json()) as { tag_name?: string; html_url?: string };
	const latestVersion = normalizeVersion(release.tag_name ?? "");
	const normalizedCurrent = normalizeVersion(currentVersion);

	if (!latestVersion || !normalizedCurrent) {
		throw new Error("Invalid version payload");
	}

	if (compareVersions(normalizedCurrent, latestVersion) < 0) {
		return {
			status: "updateAvailable",
			latestVersion,
			releaseUrl: release.html_url ?? releasesPageUrl,
		};
	}

	return { status: "upToDate", latestVersion };
}
