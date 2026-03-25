import type { DatabaseSchema } from "@/types/configuration";

type DiscoveryInput = {
	caasUrl: string;
	caasApiKey: string;
};

type RawLocale =
	| string
	| {
			language?: string;
			country?: string;
	  };

type RawDocument = {
	schema?: string;
	entityType?: string;
	locale?: RawLocale;
};

type DiscoveryResponse = {
	_embedded?: {
		["rh:doc"]?: RawDocument[];
	};
};

type FetchFilter = {
	entityType?: {
		$nin: string[];
	};
};

export const normalizeDiscoveredLocale = (locale: RawLocale): string | null => {
	if (typeof locale === "string") {
		return locale;
	}
	if (!locale || !locale.language || !locale.country) {
		return null;
	}
	return `${locale.language}_${locale.country}`;
};

const fetchCaasData = async (
	{ caasUrl, caasApiKey }: DiscoveryInput,
	additionalFilter?: FetchFilter,
): Promise<DiscoveryResponse> => {
	const url = new URL(caasUrl);
	const searchParams = new URLSearchParams();

	searchParams.append("page", "1");
	searchParams.append("pagesize", "100");
	searchParams.append(
		"keys",
		JSON.stringify({ schema: 1, entityType: 1, locale: 1 }),
	);
	searchParams.append("filter", JSON.stringify({ fsType: "Dataset" }));
	if (additionalFilter) {
		searchParams.append("filter", JSON.stringify(additionalFilter));
	}

	url.search = searchParams.toString();

	const response = await fetch(url.toString(), {
		headers: {
			Authorization: `Bearer ${caasApiKey}`,
		},
	});
	if (!response.ok) {
		throw new Error(`Discovery request failed with status ${response.status}`);
	}
	return (await response.json()) as DiscoveryResponse;
};

export const discoverSchemasAndLocales = async ({
	caasUrl,
	caasApiKey,
}: DiscoveryInput): Promise<{
	databaseSchemas: DatabaseSchema[];
	locales: string[];
}> => {
	const databaseSchemas: DatabaseSchema[] = [];
	const discoveredLocales = new Set<string>();
	let hasMoreEntityTypes = true;

	while (hasMoreEntityTypes) {
		const allEntityTypes = databaseSchemas.flatMap(
			(schema) => schema.entityTypeNames ?? [],
		);
		const additionalFilter: FetchFilter | undefined = allEntityTypes.length
			? { entityType: { $nin: allEntityTypes } }
			: undefined;
		const response = await fetchCaasData({ caasUrl, caasApiKey }, additionalFilter);
		const docs = response._embedded?.["rh:doc"] ?? [];
		if (!docs.length) {
			hasMoreEntityTypes = false;
			continue;
		}

		for (const item of docs) {
			if (
				item.schema &&
				!databaseSchemas.some((schema) => schema.name === item.schema)
			) {
				databaseSchemas.push({
					name: item.schema,
					entityTypeNames: [],
				});
			}

			if (item.entityType && item.schema) {
				const schema = databaseSchemas.find((entry) => entry.name === item.schema);
				if (schema && !schema.entityTypeNames?.includes(item.entityType)) {
					schema.entityTypeNames = [
						...(schema.entityTypeNames ?? []),
						item.entityType,
					];
				}
			}

			if (item.locale) {
				const normalizedLocale = normalizeDiscoveredLocale(item.locale);
				if (normalizedLocale) {
					discoveredLocales.add(normalizedLocale);
				}
			}
		}
	}

	return {
		databaseSchemas,
		locales: Array.from(discoveredLocales).sort(),
	};
};
