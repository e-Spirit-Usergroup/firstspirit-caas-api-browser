import type { ModeType } from "@/types/mode";

export type NavServiceOption = "full-navigation" | "seo-route" | "id";
export type NavServiceFormat = "default" | "noLinks" | "caas";

/** Encodes each segment of a route so `..`, `%` or `?` cannot change the request path. */
function encodeRoute(route: string): string {
	const segments = route
		.split("/")
		.filter((segment) => segment && segment !== "." && segment !== "..")
		.map((segment) => encodeURIComponent(segment));
	const trailingSlash = segments.length && route.endsWith("/") ? "/" : "";
	return `/${segments.join("/")}${trailingSlash}`;
}

export function buildNavServiceRequest(
	navServiceUrl: string | null | undefined,
	mode: ModeType,
	navServiceOption: NavServiceOption,
	format: NavServiceFormat,
	locale: string | null | undefined,
	depth: string,
	route: string,
	id: string,
): string | null {
	if (!navServiceUrl) return null;

	try {
		const url = new URL(navServiceUrl);
		url.pathname = url.pathname
			.replace(/(\/navigation\/)(preview|release)(\.)/, `$1${mode}$3`)
			.replace(/\/+$/, "");
		const trimmedRoute = route.trim();
		const trimmedId = id.trim();
		if (navServiceOption === "seo-route" && trimmedRoute) {
			url.pathname += `/by-seo-route${encodeRoute(trimmedRoute)}`;
		} else if (navServiceOption === "id" && trimmedId) {
			url.pathname += `/node/${encodeURIComponent(trimmedId)}`;
		}
		if (locale) url.searchParams.set("language", locale);
		if (depth.trim()) {
			url.searchParams.set("depth", depth.trim());
		}
		// "default" is the service's own default, so it does not need to be sent.
		if (format !== "default") {
			url.searchParams.set("format", format);
		}
		return url.toString();
	} catch {
		return null;
	}
}
