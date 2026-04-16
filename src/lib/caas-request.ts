import { applyModeToCaasUrl } from "@/lib/caas-url";
import type { AppFormData } from "@/types/app-form";
import type { ModeType } from "@/types/mode";

type CaaSRequestFlags = {
	np: boolean;
	rep: boolean;
	count: boolean;
};

type BuildCaaSRequestResult = {
	url: string;
	/** The page number actually used — may be forced to 1 when pagination flags are off */
	effectivePage: number;
};

export function buildCaaSRequest(
	caasUrl: string,
	mode: ModeType,
	page: number,
	locale: string | null,
	data: AppFormData,
	flags: CaaSRequestFlags,
): BuildCaaSRequestResult {
	const modeAwareCaasUrl = applyModeToCaasUrl(caasUrl, mode);
	const url = new URL(modeAwareCaasUrl);
	const searchParams = new URLSearchParams();

	if (flags.np) searchParams.append("np", "");
	if (flags.count) searchParams.append("count", "");
	if (flags.rep) searchParams.append("rep", "pj");

	// Pagination only makes sense when np + count are on and rep is off
	const effectivePage = flags.np && flags.count && !flags.rep ? page : 1;
	searchParams.append("page", effectivePage.toString());

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
		if (data.name) filter = { ...filter, name: data.name };
		if (data.identifier) filter = { ...filter, identifier: data.identifier };
		if (data.route) filter = { ...filter, route: data.route };
	}

	searchParams.append("filter", JSON.stringify(filter));
	url.search = searchParams.toString();

	return { url: url.toString(), effectivePage };
}
