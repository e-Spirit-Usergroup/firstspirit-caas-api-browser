import type { CaasApiKeys } from "@/types/configuration";
import { type ModeType, modeTypes } from "@/types/mode";

export const normalizeCaasApiKeys = (keys: CaasApiKeys): CaasApiKeys => {
	const normalized: CaasApiKeys = {};
	for (const mode of modeTypes) {
		const key = keys[mode]?.trim();
		if (key) normalized[mode] = key;
	}
	return normalized;
};

export const getAvailableModes = (keys: CaasApiKeys | undefined): ModeType[] =>
	modeTypes.filter((mode) => !!keys?.[mode]);

/** Returns the requested mode if it has an API key, otherwise the first mode that has one. */
export const resolveMode = (
	keys: CaasApiKeys | undefined,
	mode: ModeType,
): ModeType | null =>
	keys?.[mode] ? mode : (getAvailableModes(keys)[0] ?? null);
