import type { FilterType, NameOrIdentifier } from "@/types/form";

export type AppFormData = {
	filterType?: FilterType | "none";
	useNameOrIdentifier: NameOrIdentifier;
	name?: string;
	identifier?: string;
	route?: string;
	schema?: string;
	entityType?: string;
};
