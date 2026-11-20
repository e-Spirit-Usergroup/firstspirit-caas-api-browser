import type { ModeType } from "@/types/mode";

export type NavServiceOption = "full-navigation" | "seo-route" | "id";
export type NavServiceFormat = "default" | "noLinks" | "caas";

export function buildNavServiceRequest(
	navServiceUrl: string | null | undefined,
	mode: ModeType,
	_navServiceOption: NavServiceOption,
	_format: NavServiceFormat,
	locale: string | null | undefined,
	depth: string,
	_route: string,
	_id: string,
): string | null {
	if (!navServiceUrl) return null;

	try {
		const url = new URL(navServiceUrl);
		url.pathname = url.pathname.replace(
			/(\/navigation\/)(preview|release)(\.)/,
			`$1${mode}$3`,
		);
    if (_navServiceOption === "seo-route" && _route.trim()) {
      url.pathname += '/by-seo-route' + _route.trim();
    } else if (_navServiceOption === "id" && _id.trim()) {
      url.pathname += '/node/' + _id.trim();
    }
		if (locale) url.searchParams.set("language", locale);
		if (depth.trim()) {
			url.searchParams.set("depth", depth.trim());
		}
    if (_format.trim()) {
      url.searchParams.set("format", _format.trim());
    }
		return url.toString();
	} catch {
		return null;
	}
}
