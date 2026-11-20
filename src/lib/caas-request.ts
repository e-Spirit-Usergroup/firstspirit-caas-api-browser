import { applyModeToCaasUrl } from "@/lib/caas-url";
import {
	type AppFormData,
	DEFAULT_PAGE,
	DEFAULT_PAGE_SIZE,
} from "@/types/app-form";
import type { ModeType } from "@/types/mode";

type CaaSRequestFlags = {
	np: boolean;
	rep: boolean;
	count: boolean;
};

export function buildCaaSRequest(
	caasUrl: string,
	mode: ModeType,
	locale: string | null,
	data: AppFormData,
	flags: CaaSRequestFlags,
): string {
	const modeAwareCaasUrl = applyModeToCaasUrl(caasUrl, mode);
	const url = new URL(modeAwareCaasUrl);
	const searchParams = new URLSearchParams();

	if (flags.np) searchParams.append("np", "");
	if (flags.count) searchParams.append("count", "");
	if (flags.rep) searchParams.append("rep", "pj");

	// Only send paging parameters that differ from the CaaS defaults
	if (data.page != null && data.page !== DEFAULT_PAGE) {
		searchParams.append("page", String(data.page));
	}
	if (data.pagesize != null && data.pagesize !== DEFAULT_PAGE_SIZE) {
		searchParams.append("pagesize", String(data.pagesize));
	}

	let filter: Record<string, string> = {};

	if (locale) {
		const [language, country] = locale.split("_");
		filter = {
			...filter,
			"locale.country": country,
			"locale.language": language,
		};
	}

	if (data.filterType && data.filterType !== "none") {
		filter = { ...filter, fsType: data.filterType };

		if (data.schema && data.schema !== "none") {
			filter = { ...filter, schema: data.schema };
		}
		if (data.entityType && data.entityType !== "none") {
			filter = { ...filter, entityType: data.entityType };
		}
		if (data.useNameOrIdentifier === "name" && data.name) {
			filter = { ...filter, name: data.name };
		}
		if (data.useNameOrIdentifier === "identifier" && data.identifier) {
			filter = { ...filter, identifier: data.identifier };
		}
		if (data.useNameOrIdentifier === "route" && data.route) {
			filter = { ...filter, route: data.route };
		}
	}

	searchParams.append("filter", JSON.stringify(filter));
	url.search = searchParams.toString();

	return url.toString();
}
