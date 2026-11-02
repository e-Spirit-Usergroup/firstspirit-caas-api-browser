import type { StageType } from "@/types/stage";

export const MAGIC_PASTE_PROJECT_ID_PLACEHOLDER = "[INSERT_PROJECT_ID]";

const PROJECT_RESOURCE_PATTERN =
	/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(preview|release)\.content$/i;
const HOST_PATTERN = /^(.+)-caas-api\.e-spirit\.cloud$/i;
const HAS_SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;

export type MagicPasteCaasUrl = {
	customerName: string;
	stage: StageType;
	caasUrl: string;
};

const toCustomerDisplayName = (customerSlug: string): string =>
	customerSlug
		.split("-")
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");

const unwrapClipboardText = (raw: string): string =>
	raw
		.trim()
		.replace(/^['"]+|['"]+$/g, "")
		.trim();

const ensureHttpsUrl = (raw: string): string => {
	if (raw.startsWith("//")) {
		return `https:${raw}`;
	}
	if (!HAS_SCHEME_PATTERN.test(raw)) {
		return `https://${raw}`;
	}
	return raw;
};

const parseHostPrefix = (
	hostPrefix: string,
): { customerSlug: string; stage: StageType; tenantId: string } | null => {
	if (hostPrefix.endsWith("-dev")) {
		const customerSlug = hostPrefix.slice(0, -"-dev".length);
		if (!customerSlug) {
			return null;
		}
		return { customerSlug, stage: "dev", tenantId: `${customerSlug}-dev` };
	}
	if (hostPrefix.endsWith("-qa")) {
		const customerSlug = hostPrefix.slice(0, -"-qa".length);
		if (!customerSlug) {
			return null;
		}
		return { customerSlug, stage: "qa", tenantId: `${customerSlug}-qa` };
	}
	if (!hostPrefix || hostPrefix.endsWith("-prod")) {
		return null;
	}
	return {
		customerSlug: hostPrefix,
		stage: "prod",
		tenantId: `${hostPrefix}-prod`,
	};
};

export function parseMagicPasteCaasUrl(raw: string): MagicPasteCaasUrl | null {
	const trimmed = unwrapClipboardText(raw);
	if (!trimmed) {
		return null;
	}

	let url: URL;
	try {
		url = new URL(ensureHttpsUrl(trimmed));
	} catch {
		return null;
	}

	if (url.protocol !== "https:" && url.protocol !== "http:") {
		return null;
	}

	const hostMatch = url.hostname.match(HOST_PATTERN);
	if (!hostMatch?.[1]) {
		return null;
	}

	const derived = parseHostPrefix(hostMatch[1].toLowerCase());
	if (!derived) {
		return null;
	}

	const pathSegments = url.pathname
		.replace(/\/+$/, "")
		.split("/")
		.filter(Boolean);

	if (pathSegments.length > 2) {
		return null;
	}

	let projectId = MAGIC_PASTE_PROJECT_ID_PLACEHOLDER;
	if (pathSegments.length >= 1) {
		const tenantId = pathSegments[0].toLowerCase();
		if (tenantId !== derived.tenantId) {
			return null;
		}
	}
	if (pathSegments.length === 2) {
		const resourceMatch = pathSegments[1].match(PROJECT_RESOURCE_PATTERN);
		if (!resourceMatch?.[1]) {
			return null;
		}
		projectId = resourceMatch[1].toLowerCase();
	}

	const hostPrefix =
		derived.stage === "prod"
			? derived.customerSlug
			: `${derived.customerSlug}-${derived.stage}`;
	const caasUrl = `https://${hostPrefix}-caas-api.e-spirit.cloud/${derived.tenantId}/${projectId}.preview.content`;

	return {
		customerName: toCustomerDisplayName(derived.customerSlug),
		stage: derived.stage,
		caasUrl,
	};
}
