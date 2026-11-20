import type { FilterType, NameOrIdentifier } from "@/types/form";

export type AppFormData = {
	filterType?: FilterType | "none";
	useNameOrIdentifier?: NameOrIdentifier | "none";
	name?: string;
	identifier?: string;
	route?: string;
	schema?: string;
	entityType?: string;
	page: number;
	pagesize: number;
};

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
