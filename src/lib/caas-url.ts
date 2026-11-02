import type { ModeType } from "@/types/mode";
import type { StageType } from "@/types/stage";

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

// The first path segment is the tenant id `CUSTOMER-STAGE`, e.g. /example-dev/<project>.preview.content
const tenantStagePattern = /-(dev|qa|prod)$/i;

export const getStageFromCaasUrl = (urlValue: string): StageType | null => {
	try {
		const [tenantId] = new URL(urlValue).pathname.split("/").filter(Boolean);
		const match = tenantId?.match(tenantStagePattern);
		return match ? (match[1].toLowerCase() as StageType) : null;
	} catch {
		return null;
	}
};
