import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	DefaultableField,
	inactiveInputClass,
} from "@/components/ui/defaultable-field";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type {
	NavServiceFormat,
	NavServiceOption,
} from "@/lib/nav-service-request";
import { cn } from "@/lib/tw-utils";

const navigationOptions = [
	{ value: "full-navigation", labelKey: "fullNavigation" },
	{ value: "seo-route", labelKey: "bySeoRoute" },
	{ value: "id", labelKey: "byId" },
] as const;

const formatOptions = ["default", "noLinks", "caas"] as const;

type PillGroupProps<T extends string> = {
	label: string;
	options: readonly { value: T; label: string }[];
	value: T;
	onChange: (value: T) => void;
};

function PillGroup<T extends string>({
	label,
	options,
	value,
	onChange,
}: PillGroupProps<T>) {
	return (
		<fieldset className="flex min-w-0 flex-col gap-2">
			<legend className="mb-2 text-sm font-semibold">{label}</legend>
			<div className="flex flex-wrap gap-1.5">
				{options.map((option) => {
					const isSelected = value === option.value;
					return (
						<Button
							key={option.value}
							type="button"
							variant="outline"
							aria-pressed={isSelected}
							onClick={() => onChange(option.value)}
							className="h-9 px-3.5 aria-pressed:border-foreground aria-pressed:bg-muted aria-pressed:font-semibold aria-pressed:shadow-[inset_0_0_0_1px_var(--foreground)]"
						>
							{option.label}
						</Button>
					);
				})}
			</div>
		</fieldset>
	);
}

type NavServiceParametersProps = {
	selectedOption: NavServiceOption;
	onOptionChange: (option: NavServiceOption) => void;
	depth: string;
	onDepthChange: (depth: string) => void;
	route: string;
	onRouteChange: (route: string) => void;
	id: string;
	onIdChange: (id: string) => void;
	selectedFormat: NavServiceFormat;
	onFormatChange: (format: NavServiceFormat) => void;
};

function NavServiceParameters({
	selectedOption,
	onOptionChange,
	depth,
	onDepthChange,
	route,
	onRouteChange,
	id,
	onIdChange,
	selectedFormat,
	onFormatChange,
}: NavServiceParametersProps) {
	const { t } = useTranslation();
	const depthId = useId();
	// No depth means "all levels", which is also what the service does without the parameter
	const isDepthDefault = depth.trim() === "";
	const routeId = useId();
	const idId = useId();

	return (
		<>
			<PillGroup
				label={t("app.form.navigationService.queryType")}
				options={navigationOptions.map(({ value, labelKey }) => ({
					value,
					label: t(`app.form.navigationService.${labelKey}`),
				}))}
				value={selectedOption}
				onChange={onOptionChange}
			/>
			{selectedOption === "seo-route" && (
				<FormField
					label={t("app.form.navigationService.route")}
					htmlFor={routeId}
				>
					<Input
						id={routeId}
						type="text"
						required
						placeholder="/de/…"
						className="font-mono"
						value={route}
						onChange={(event) => onRouteChange(event.target.value)}
					/>
				</FormField>
			)}
			{selectedOption === "id" && (
				<FormField label={t("app.form.navigationService.id")} htmlFor={idId}>
					<Input
						id={idId}
						type="text"
						required
						className="font-mono"
						value={id}
						onChange={(event) => onIdChange(event.target.value)}
					/>
				</FormField>
			)}
			<PillGroup
				label={t("app.form.navigationService.format")}
				options={formatOptions.map((value) => ({ value, label: value }))}
				value={selectedFormat}
				onChange={onFormatChange}
			/>
			<DefaultableField
				isDefault={isDepthDefault}
				label={t("app.form.navigationService.depth")}
				htmlFor={depthId}
			>
				<Input
					id={depthId}
					type="number"
					min={0}
					step={1}
					placeholder={t("app.form.navigationService.allLevels")}
					className={cn("w-36", isDepthDefault && inactiveInputClass)}
					value={depth}
					onChange={(event) => onDepthChange(event.target.value)}
				/>
			</DefaultableField>
		</>
	);
}

export { NavServiceParameters };
