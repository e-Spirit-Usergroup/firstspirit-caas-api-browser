import type { ReactNode } from "react";
import type { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { AppFormData } from "@/types/app-form";
import type { DatabaseSchema } from "@/types/configuration";
import {
	type FilterType,
	filterTypeOptionColors,
	filterTypeOptionTexts,
	type NameOrIdentifier,
	nameOrIdentifierOptionTexts,
} from "@/types/form";

function FilterTypeOptionLabel({
	color,
	children,
}: {
	color?: string;
	children: ReactNode;
}) {
	return (
		<span className="inline-flex items-center gap-2">
			<span
				className="inline-block size-3 shrink-0 rounded-full"
				style={{ backgroundColor: color ?? "transparent" }}
			/>
			{children}
		</span>
	);
}

type FilterSectionProps = {
	filterType: FilterType | "none" | undefined;
	useNameOrIdentifier: NameOrIdentifier | "none" | undefined;
	schema: string | undefined;
	entityType: string | undefined;
	databaseSchemas: DatabaseSchema[] | null | undefined;
	filterSelectId: string;
	selectNameOrIdentifierId: string;
	setValue: UseFormSetValue<AppFormData>;
	register: UseFormRegister<AppFormData>;
};

function FilterSection({
	filterType,
	useNameOrIdentifier,
	schema,
	entityType,
	databaseSchemas,
	filterSelectId,
	selectNameOrIdentifierId,
	setValue,
	register,
}: FilterSectionProps) {
	const { t } = useTranslation();

	const handleFilterTypeChange = (value: FilterType | "none") => {
		setValue("filterType", value);
		setValue("useNameOrIdentifier", "none");
		setValue("name", undefined);
		setValue("schema", undefined);
		setValue("entityType", undefined);
		setValue("identifier", undefined);
		setValue("route", undefined);
	};

	const handleNameOrIdentifierChange = (value: NameOrIdentifier | "none") => {
		setValue("useNameOrIdentifier", value);
		setValue("name", undefined);
		setValue("identifier", undefined);
		setValue("route", undefined);
	};

	const parameterOptions = (
		Object.keys(nameOrIdentifierOptionTexts) as NameOrIdentifier[]
	).filter((type) => {
		if (filterType === "PageRef") return true;
		return type !== "route";
	});

	const selectedSchemaEntityTypes =
		databaseSchemas?.find((s) => s.name === schema)?.entityTypeNames ?? [];

	return (
		<>
			{/* Filter type selector */}
			<div className="col-span-12 flex flex-col gap-1.5">
				<span className="text-sm font-semibold">
					{t("app.form.filterDropdown.selectFilterType")}
				</span>
				<Select
					items={[
						{
							value: "none",
							label: (
								<FilterTypeOptionLabel>
									{t("app.form.filterDropdown.noFilter")}
								</FilterTypeOptionLabel>
							),
						},
						...(Object.keys(filterTypeOptionTexts) as FilterType[]).map(
							(type) => ({
								value: type,
								label: (
									<FilterTypeOptionLabel color={filterTypeOptionColors[type]}>
										{filterTypeOptionTexts[type]}
									</FilterTypeOptionLabel>
								),
							}),
						),
					]}
					onValueChange={(value) =>
						handleFilterTypeChange(value as FilterType | "none")
					}
					value={filterType ?? "none"}
				>
					<SelectTrigger className="flex-initial w-46" id={filterSelectId}>
						<SelectValue
							placeholder={t("app.form.filterDropdown.placeholder")}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">
							<FilterTypeOptionLabel>
								{t("app.form.filterDropdown.noFilter")}
							</FilterTypeOptionLabel>
						</SelectItem>
						<SelectSeparator />
						{(Object.keys(filterTypeOptionTexts) as FilterType[]).map(
							(type) => (
								<SelectItem key={type} value={type}>
									<FilterTypeOptionLabel color={filterTypeOptionColors[type]}>
										{filterTypeOptionTexts[type]}
									</FilterTypeOptionLabel>
								</SelectItem>
							),
						)}
					</SelectContent>
				</Select>
			</div>

			{/* Name / Identifier / Route selector */}
			{filterType &&
				filterType !== "none" &&
				filterType !== "Dataset" &&
				filterType !== "ProjectProperties" && (
					<div className="col-span-12 flex flex-col gap-1.5">
						<span className="text-sm font-semibold">
							{t("app.form.filterParameterDropdown.label")}
						</span>
						<div className="flex gap-4">
							<Select
								items={[
									{
										value: "none",
										label: t("app.form.filterParameterDropdown.noFilter"),
									},
									...parameterOptions.map((type) => ({
										value: type,
										label: nameOrIdentifierOptionTexts[type],
									})),
								]}
								onValueChange={(value) =>
									handleNameOrIdentifierChange(
										value as NameOrIdentifier | "none",
									)
								}
								value={useNameOrIdentifier ?? "none"}
							>
								<SelectTrigger
									className="flex-initial w-42 gap-2"
									id={selectNameOrIdentifierId}
								>
									<SelectValue
										placeholder={t(
											"app.form.filterParameterDropdown.placeholder",
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">
										<span className="inline-flex items-center gap-2">
											{t("app.form.filterParameterDropdown.noFilter")}
										</span>
									</SelectItem>
									<SelectSeparator />
									{parameterOptions.map((type) => (
										<SelectItem key={type} value={type}>
											<span className="inline-flex items-center gap-2">
												<span className="inline-block size-3 rounded-full" />
												{nameOrIdentifierOptionTexts[type]}
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							{useNameOrIdentifier === "identifier" ? (
								<Input
									type="text"
									placeholder={t(
										"app.form.filterParameterDropdown.identifierPlaceholder",
									)}
									{...register("identifier")}
								/>
							) : useNameOrIdentifier === "name" ? (
								<Input
									type="text"
									placeholder={t(
										"app.form.filterParameterDropdown.namePlaceholder",
									)}
									{...register("name")}
								/>
							) : useNameOrIdentifier === "route" ? (
								<Input
									type="text"
									placeholder={t(
										"app.form.filterParameterDropdown.routePlaceholder",
									)}
									{...register("route")}
								/>
							) : null}
						</div>
					</div>
				)}

			{/* Dataset schema + entity type selectors */}
			{filterType === "Dataset" && databaseSchemas?.length ? (
				<>
					<div className="col-span-6 flex flex-col gap-1.5">
						<span className="text-sm font-semibold">
							{t("app.form.entityTypeDropdown.schemaLabel")}
						</span>
						<Select
							items={[
								{
									value: "none",
									label: t("app.form.entityTypeDropdown.noSchemaFilter"),
								},
								...databaseSchemas.map((s) => ({
									value: s.name,
									label: s.name,
								})),
							]}
							onValueChange={(value) => {
								setValue("schema", value);
								setValue("entityType", undefined);
							}}
							value={schema ?? "none"}
						>
							<SelectTrigger className="flex-initial">
								<SelectValue
									placeholder={t(
										"app.form.entityTypeDropdown.schemaPlaceholder",
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">
									<span className="inline-flex items-center gap-2">
										{t("app.form.entityTypeDropdown.noSchemaFilter")}
									</span>
								</SelectItem>
								<SelectSeparator />
								{databaseSchemas.map((s) => (
									<SelectItem key={s.name} value={s.name}>
										<span className="inline-flex items-center gap-2">
											{s.name}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="col-span-6 flex flex-col gap-1.5">
						<span className="text-sm font-semibold">
							{t("app.form.entityTypeDropdown.entityTypeLabel")}
						</span>
						<Select
							items={[
								{
									value: "none",
									label: t("app.form.entityTypeDropdown.noEntityTypeFilter"),
								},
								...selectedSchemaEntityTypes.map((et) => ({
									value: et,
									label: et,
								})),
							]}
							onValueChange={(value) => setValue("entityType", value)}
							value={entityType ?? "none"}
							disabled={!schema || schema === "none"}
						>
							<SelectTrigger className="flex-initial">
								<SelectValue
									placeholder={t(
										"app.form.entityTypeDropdown.entityTypePlaceholder",
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">
									<span className="inline-flex items-center gap-2">
										{t("app.form.entityTypeDropdown.noEntityTypeFilter")}
									</span>
								</SelectItem>
								{selectedSchemaEntityTypes.length > 0 && <SelectSeparator />}
								{selectedSchemaEntityTypes.map((et) => (
									<SelectItem key={`${schema}-${et}`} value={et}>
										<span className="inline-flex items-center gap-2">{et}</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</>
			) : null}
		</>
	);
}

export { FilterSection };
