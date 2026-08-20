import type { FilterType, NameOrIdentifier } from "@/types/form";

export type AppFormData = {
	filterType?: FilterType | "none";
	useNameOrIdentifier?: NameOrIdentifier | "none";
	name?: string;
	identifier?: string;
	route?: string;
	schema?: string;
	entityType?: string;
};
