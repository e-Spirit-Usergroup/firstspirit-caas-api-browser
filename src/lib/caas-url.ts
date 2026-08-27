import type { ModeType } from "@/types/mode";

const modeSegmentPattern = /\.(preview|release)\.content$/;

const replaceModeSegment = (urlValue: string, mode: ModeType): string => {
	try {
		const url = new URL(urlValue);
		if (!modeSegmentPattern.test(url.pathname)) {
			return urlValue;
		}
		url.pathname = url.pathname.replace(modeSegmentPattern, `.${mode}.content`);
		return url.toString();
	} catch {
		return urlValue;
	}
};

export const normalizeCaasUrlForStorage = (urlValue: string): string =>
	replaceModeSegment(urlValue, "preview");

export const applyModeToCaasUrl = (urlValue: string, mode: ModeType): string =>
	replaceModeSegment(urlValue, mode);
