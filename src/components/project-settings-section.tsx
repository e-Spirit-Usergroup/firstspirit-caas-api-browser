import { useTranslation } from "react-i18next";
import type { ProjectConfig } from "@/types/configuration";
import { type ModeType, modeOptionTexts, modeTypes } from "@/types/mode";
import { type StageType, stageOptionTexts } from "@/types/stage";
import Icon from "./icons/icon";
import { Button } from "./ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

type ProjectSettingsSectionProps = {
	localCustomerName: string;
	localStage: StageType;
	localProjectName: string;
	localLocale: string;
	localMode: ModeType;
	customerOptions: string[];
	stageOptions: StageType[];
	projectOptions: ProjectConfig[];
	localeOptions: string[];
	onCustomerChange: (value: string) => void;
	onStageChange: (value: StageType) => void;
	onProjectChange: (value: string) => void;
	onLocaleChange: (value: string) => void;
	onModeChange: (value: ModeType) => void;
	onManageProjects: () => void;
};

function ProjectSettingsSection({
	localCustomerName,
	localStage,
	localProjectName,
	localLocale,
	localMode,
	customerOptions,
	stageOptions,
	projectOptions,
	localeOptions,
	onCustomerChange,
	onStageChange,
	onProjectChange,
	onLocaleChange,
	onModeChange,
	onManageProjects,
}: ProjectSettingsSectionProps) {
	const { t } = useTranslation();

	return (
		<div className="flex flex-col gap-2 mt-4">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold">{t("app.form.project")}</h2>
				<Button
					type="button"
					onClick={onManageProjects}
					variant="ghost"
					size="sm"
					className="text-muted-foreground gap-1.5"
				>
					<Icon icon="plus-circle" className="size-4" />
					{t("app.settings.dialog.manageProjects")}
				</Button>
			</div>

			<div className="grid grid-cols-3 gap-3">
				<div className="flex flex-col gap-1.5">
					<span className="text-sm">{t("app.form.customer")}</span>
					<Select
						value={localCustomerName}
						items={customerOptions.map((name) => ({
							value: name,
							label: name,
						}))}
						onValueChange={onCustomerChange}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder={t("app.form.customer")} />
						</SelectTrigger>
						<SelectContent>
							{customerOptions.map((name) => (
								<SelectItem key={name} value={name}>
									{name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-1.5">
					<span className="text-sm">{t("app.form.stage")}</span>
					<Select
						value={localStage}
						items={stageOptions.map((stage) => ({
							value: stage,
							label: stageOptionTexts[stage],
						}))}
						onValueChange={(value) => onStageChange(value as StageType)}
						disabled={!stageOptions.length}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder={t("app.form.stage")} />
						</SelectTrigger>
						<SelectContent>
							{stageOptions.map((stage) => (
								<SelectItem key={stage} value={stage}>
									{stageOptionTexts[stage]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-1.5">
					<span className="text-sm">{t("app.form.project")}</span>
					<Select
						value={localProjectName}
						items={projectOptions.map((project) => ({
							value: project.projectName,
							label: project.projectName,
						}))}
						onValueChange={onProjectChange}
						disabled={!projectOptions.length}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder={t("app.form.project")} />
						</SelectTrigger>
						<SelectContent>
							{projectOptions.map((project) => (
								<SelectItem
									key={project.projectName}
									value={project.projectName}
								>
									{project.projectName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div className="flex flex-col gap-1.5">
					<span className="text-sm">
						{t("app.settings.dialog.locale.label")}
					</span>
					<Select
						value={localLocale}
						items={localeOptions.map((loc) => ({
							value: loc,
							label: loc,
						}))}
						onValueChange={onLocaleChange}
						disabled={!localeOptions.length}
					>
						<SelectTrigger className="w-full">
							<SelectValue
								placeholder={t("app.settings.dialog.locale.label")}
							/>
						</SelectTrigger>
						<SelectContent>
							{localeOptions.map((loc) => (
								<SelectItem key={loc} value={loc}>
									{loc}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-1.5">
					<span className="text-sm">{t("app.settings.dialog.mode.label")}</span>
					<Select
						value={localMode}
						items={modeTypes.map((modeType) => ({
							value: modeType,
							label: modeOptionTexts[modeType],
						}))}
						onValueChange={(value) => onModeChange(value as ModeType)}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder={t("app.settings.dialog.mode.label")} />
						</SelectTrigger>
						<SelectContent>
							{modeTypes.map((modeType) => (
								<SelectItem key={modeType} value={modeType}>
									{modeOptionTexts[modeType]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	);
}

export { ProjectSettingsSection };
