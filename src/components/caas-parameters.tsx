import { useId } from "react";
import type {
	FieldErrors,
	UseFormRegister,
	UseFormSetValue,
	UseFormWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FilterSection } from "@/components/filter-section";
import { CheckboxFieldWithTooltip } from "@/components/ui/checkbox-field-with-tooltip";
import {
	DefaultableField,
	inactiveInputClass,
} from "@/components/ui/defaultable-field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/tw-utils";
import { useSettingsStore } from "@/stores/settings-store";
import {
	type AppFormData,
	DEFAULT_PAGE,
	DEFAULT_PAGE_SIZE,
	MAX_PAGE_SIZE,
} from "@/types/app-form";
import type { DatabaseSchema } from "@/types/configuration";

interface CaaSParametersProps {
	databaseSchemas: DatabaseSchema[] | null | undefined;
	register: UseFormRegister<AppFormData>;
	setValue: UseFormSetValue<AppFormData>;
	watch: UseFormWatch<AppFormData>;
	errors: FieldErrors<AppFormData>;
}

/** Keys a number input would otherwise accept that never belong in a positive integer. */
const NON_INTEGER_KEYS = new Set(["e", "E", ".", ",", "+", "-"]);

function blockNonIntegerKeys(event: React.KeyboardEvent<HTMLInputElement>) {
	if (NON_INTEGER_KEYS.has(event.key)) event.preventDefault();
}

function CaaSParameters({
	databaseSchemas,
	register,
	setValue,
	watch,
	errors,
}: CaaSParametersProps) {
	const { t } = useTranslation();
	const pageId = useId();
	const pageSizeId = useId();
	const filterSelectId = useId();
	const selectNameOrIdentifierId = useId();
	const repId = useId();
	const countId = useId();
	const filterType = watch("filterType");
	const schema = watch("schema");
	const entityType = watch("entityType");
	const useNameOrIdentifier = watch("useNameOrIdentifier");
	const isPageDefault = watch("page") === DEFAULT_PAGE;
	const isPageSizeDefault = watch("pagesize") === DEFAULT_PAGE_SIZE;
	const { rep, setRep, count, setCount } = useSettingsStore();

	return (
		<>
			<FilterSection
				filterType={filterType}
				useNameOrIdentifier={useNameOrIdentifier}
				schema={schema}
				entityType={entityType}
				databaseSchemas={databaseSchemas}
				filterSelectId={filterSelectId}
				selectNameOrIdentifierId={selectNameOrIdentifierId}
				setValue={setValue}
				register={register}
			/>
			<div className="flex flex-wrap gap-x-6 gap-y-4">
				<DefaultableField
					isDefault={isPageDefault}
					label={t("app.form.pagination.page")}
					htmlFor={pageId}
					error={errors.page?.message}
				>
					<Input
						id={pageId}
						type="number"
						inputMode="numeric"
						min={1}
						step={1}
						className={cn("w-32", isPageDefault && inactiveInputClass)}
						aria-invalid={!!errors.page}
						onKeyDown={blockNonIntegerKeys}
						{...register("page", {
							valueAsNumber: true,
							validate: (value) =>
								(Number.isInteger(value) && value >= 1) ||
								t("app.form.pagination.pageError"),
						})}
					/>
				</DefaultableField>
				<DefaultableField
					isDefault={isPageSizeDefault}
					label={t("app.form.pagination.pageSize")}
					htmlFor={pageSizeId}
					error={errors.pagesize?.message}
				>
					<Input
						id={pageSizeId}
						type="number"
						inputMode="numeric"
						min={1}
						max={MAX_PAGE_SIZE}
						step={1}
						className={cn("w-32", isPageSizeDefault && inactiveInputClass)}
						aria-invalid={!!errors.pagesize}
						onKeyDown={blockNonIntegerKeys}
						{...register("pagesize", {
							valueAsNumber: true,
							validate: (value) =>
								(Number.isInteger(value) &&
									value >= 1 &&
									value <= MAX_PAGE_SIZE) ||
								t("app.form.pagination.pageSizeError", {
									max: MAX_PAGE_SIZE,
								}),
						})}
					/>
				</DefaultableField>
			</div>
			<div className="flex flex-col gap-3">
				<h2 className="text-sm font-semibold">
					{t("app.settings.dialog.queryParams.label")}
				</h2>
				<div className="flex flex-wrap items-center gap-x-8 gap-y-3">
					<CheckboxFieldWithTooltip
						id={repId}
						label={t("app.settings.dialog.queryParams.repS.label")}
						checked={rep}
						onCheckedChange={setRep}
						tooltipIcon="exclamation-triangle"
						tooltipIconColor="text-orange-500"
						tooltipText={t("app.settings.dialog.queryParams.repS.tooltip")}
					/>
					<CheckboxFieldWithTooltip
						id={countId}
						label={t("app.settings.dialog.queryParams.count.label")}
						checked={count}
						onCheckedChange={setCount}
						tooltipIcon="information-circle"
						tooltipIconColor="text-blue-500"
						tooltipText={t("app.settings.dialog.queryParams.count.tooltip")}
					/>
				</div>
			</div>
		</>
	);
}

export { CaaSParameters };
