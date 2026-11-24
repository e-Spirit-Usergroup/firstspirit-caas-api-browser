// The last path segment of a CaaS URL is `<projectId>.<preview|release>.content`.
const caasProjectSegmentPattern = /^([^.]+)\.(preview|release)\.content$/;

/**
 * Derives the navigation service URL from a CaaS URL, e.g.
 * https://x-caas-api.e-spirit.cloud/x-dev/<id>.preview.content
 * -> https://x-navigationservice.e-spirit.cloud/navigation/preview.<id>
 *
 * Returns "" when the CaaS URL does not follow this pattern.
 */
export function inferNavServiceUrl(caasUrl: string): string {
	try {
		const url = new URL(caasUrl);
		const segments = url.pathname.split("/").filter(Boolean);
		const match = segments[segments.length - 1]?.match(
			caasProjectSegmentPattern,
		);
		if (!match || !url.hostname.includes("caas-api")) return "";
		const [, projectId, mode] = match;
		const host = url.host.replace("caas-api", "navigationservice");
		return `${url.protocol}//${host}/navigation/${mode}.${projectId}`;
	} catch {
		return "";
	}
}

/** Uses the stored URL when the user set one, otherwise derives it from the CaaS URL. */
export function resolveNavServiceUrl(
	navigationServiceUrl: unknown,
	caasUrl: string,
): string {
	if (typeof navigationServiceUrl === "string" && navigationServiceUrl.trim()) {
		return navigationServiceUrl.trim();
	}
	return inferNavServiceUrl(caasUrl);
}
