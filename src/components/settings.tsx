import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@components/ui/tooltip";
import { Description } from "@radix-ui/react-dialog";
import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { updaterConfig } from "@/config/updater";
import {
	getActiveProjectFromState,
	useCaaSConfigStore,
} from "@/stores/caas-config-store";
import { useSettingsStore } from "@/stores/settings-store";
import { type ModeType, modeOptionTexts, modeTypes } from "@/types/mode";
import { type StageType, stageOptionTexts } from "@/types/stage";
import { version } from "../../package.json";
import Icon from "./icons/icon";
import ManageProjectsDialog from "./manage-projects-dialog";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

type UpdateCheckResult =
	| {
			status: "upToDate";
			latestVersion: string;
	  }
	| {
			status: "updateAvailable";
			latestVersion: string;
			releaseUrl: string;
	  }
	| {
			status: "error";
	  };

const normalizeVersion = (rawVersion: string): string =>
	rawVersion.trim().replace(/^v/i, "").split("-")[0].split("+")[0];

const compareVersions = (leftVersion: string, rightVersion: string): number => {
	const leftParts = leftVersion.split(".").map((part) => Number(part));
	const rightParts = rightVersion.split(".").map((part) => Number(part));
	const maxLength = Math.max(leftParts.length, rightParts.length);

	for (let index = 0; index < maxLength; index += 1) {
		const leftPart = Number.isFinite(leftParts[index]) ? leftParts[index] : 0;
		const rightPart = Number.isFinite(rightParts[index])
			? rightParts[index]
			: 0;

		if (leftPart > rightPart) return 1;
		if (leftPart < rightPart) return -1;
	}

	return 0;
};

function Settings() {
	const { t } = useTranslation();

	const npId = useId();
	const repId = useId();
	const countId = useId();

	const {
		locale,
		setLocale,
		mode,
		setMode,
		np,
		setNp,
		rep,
		setRep,
		count,
		setCount,
	} = useSettingsStore();

	const {
		customers,
		activeSelection,
		setActiveCustomer,
		setActiveStage,
		setActiveProject,
	} = useCaaSConfigStore();
	const activeProject = useMemo(
		() => getActiveProjectFromState({ customers, activeSelection }),
		[customers, activeSelection],
	);
	const locales = activeProject?.locales ?? [];
	const customerOptions = customers.map((customer) => customer.customerName);
	const selectedCustomerName = activeSelection?.customerName ?? "";
	const selectedCustomer = customers.find(
		(customer) => customer.customerName === selectedCustomerName,
	);
	const stageOptions = selectedCustomer
		? (Object.keys(selectedCustomer.stages) as StageType[]).filter(
				(stage) => selectedCustomer.stages[stage].length > 0,
			)
		: [];
	const selectedStage = activeSelection?.stage ?? "";
	const projectOptions = selectedCustomer
		? (selectedCustomer.stages[activeSelection?.stage ?? "dev"] ?? [])
		: [];
	const selectedProjectName = activeSelection?.projectName ?? "";
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isManageProjectsOpen, setIsManageProjectsOpen] = useState(false);
	const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
	const [updateCheckResult, setUpdateCheckResult] =
		useState<UpdateCheckResult | null>(null);

	if (!locale && locales.length > 0) {
		setLocale(locales[0]);
	}

	const onAddProjectClick = () => {
		setIsSettingsOpen(false);
		setIsManageProjectsOpen(false);
	};

	const openManageProjectsDialog = () => {
		setIsSettingsOpen(false);
		setIsManageProjectsOpen(true);
	};

	const checkForUpdate = async () => {
		setIsCheckingUpdate(true);
		setUpdateCheckResult(null);

		try {
			const response = await fetch(updaterConfig.latestReleaseApiUrl);
			if (!response.ok) {
				throw new Error(`Update check failed with status ${response.status}`);
			}

			const release = (await response.json()) as {
				tag_name?: string;
				html_url?: string;
			};
			const latestVersion = normalizeVersion(release.tag_name ?? "");
			const currentVersion = normalizeVersion(version);

			if (!latestVersion || !currentVersion) {
				throw new Error("Invalid version payload");
			}

			const comparison = compareVersions(currentVersion, latestVersion);
			if (comparison < 0) {
				setUpdateCheckResult({
					status: "updateAvailable",
					latestVersion,
					releaseUrl: release.html_url ?? updaterConfig.releasesPageUrl,
				});
			} else {
				setUpdateCheckResult({
					status: "upToDate",
					latestVersion,
				});
			}
		} catch {
			setUpdateCheckResult({ status: "error" });
		} finally {
			setIsCheckingUpdate(false);
		}
	};

	return (
		<>
			<Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
				<DialogTrigger asChild>
					<Button type="button" variant="ghost">
						<Icon icon="settings" />
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-4xl w-[95vw]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-1.5">
							<Icon icon="settings" />
							{t("app.settings.dialog.title")}
						</DialogTitle>
					</DialogHeader>
					<Description className="text-sm mt-0">
						{t("app.settings.dialog.subtitle")}
					</Description>
					<div className="grid w-full grid-cols-3 gap-2">
						<h2 className="font-semibold col-span-3">
							{t("app.form.project")}
						</h2>
						<div className="flex flex-col gap-1.5">
							<span className="text-sm">{t("app.form.customer")}</span>
							<Select
								value={selectedCustomerName}
								onValueChange={(value) => setActiveCustomer(value)}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder={t("app.form.customer")} />
								</SelectTrigger>
								<SelectContent>
									{customerOptions.map((customerName) => (
										<SelectItem key={customerName} value={customerName}>
											{customerName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-1.5">
							<span className="text-sm">{t("app.form.stage")}</span>
							<Select
								value={selectedStage}
								onValueChange={(value) => setActiveStage(value as StageType)}
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
								value={selectedProjectName}
								onValueChange={(value) => setActiveProject(value)}
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

					<div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2">
						<div className="flex flex-col gap-1.5">
							<span className="text-sm">
								{t("app.settings.dialog.locale.label")}
							</span>
							<Select
								value={locale || locales[0] || ""}
								onValueChange={setLocale}
								disabled={!locales.length}
							>
								<SelectTrigger className="flex-initial">
									<SelectValue placeholder="locale" />
								</SelectTrigger>
								<SelectContent>
									{locales.map((locale) => (
										<SelectItem key={locale} value={locale}>
											{locale}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-1.5">
							<span className="text-sm">
								{t("app.settings.dialog.mode.label")}
							</span>
							<Select
								value={mode}
								onValueChange={(value) => setMode(value as ModeType)}
							>
								<SelectTrigger className="flex-initial">
									<SelectValue placeholder="mode" />
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

					<div className="grid w-full grid-cols-3 gap-2">
						<h2 className="font-semibold col-span-3">
							{t("app.settings.dialog.queryParams.label")}
						</h2>
						<div className="flex items-center space-x-4">
							<Input
								checked={np}
								onChange={(e) => setNp(e.target.checked)}
								type="checkbox"
								id={npId}
								className="size-4"
							/>
							<label htmlFor={npId} className="text-sm font-medium">
								{t("app.settings.dialog.queryParams.np.label")}
							</label>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<Icon icon="information-circle" className="size-5" />
									</TooltipTrigger>
									<TooltipContent className="max-w-64">
										<p>{t("app.settings.dialog.queryParams.np.tooltip")}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
						<div className="flex items-center space-x-4">
							<Input
								checked={rep}
								onChange={(e) => setRep(e.target.checked)}
								type="checkbox"
								id={repId}
								className="size-4"
							/>
							<label htmlFor={repId} className="text-sm font-medium">
								{t("app.settings.dialog.queryParams.repPj.label")}
							</label>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<Icon
											icon="exclamation-triangle"
											className="size-5 text-red-500"
										/>
									</TooltipTrigger>
									<TooltipContent className="max-w-64">
										<p>{t("app.settings.dialog.queryParams.repPj.tooltip")}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
						<div className="flex items-center space-x-4">
							<Input
								checked={count}
								onChange={(e) => setCount(e.target.checked)}
								type="checkbox"
								id={countId}
								className="size-4"
							/>
							<label htmlFor={countId} className="text-sm font-medium">
								{t("app.settings.dialog.queryParams.count.label")}
							</label>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<Icon
											icon="information-circle"
											className="size-5 text-yellow-500"
										/>
									</TooltipTrigger>
									<TooltipContent className="max-w-64">
										<p>{t("app.settings.dialog.queryParams.count.tooltip")}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
					</div>

					<div className="grid w-full grid-cols-3 gap-2">
						<h2 className="font-semibold col-span-3">
							{t("app.settings.dialog.update.label")}
						</h2>
						<div className="col-span-3 flex flex-wrap items-center gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={checkForUpdate}
								disabled={isCheckingUpdate}
							>
								<Icon icon="arrow-clockwise" className="size-4" />
								{isCheckingUpdate
									? t("app.settings.dialog.update.checking")
									: t("app.settings.dialog.update.checkButton")}
							</Button>
							<span className="text-xs text-muted-foreground">
								{t("app.settings.dialog.update.currentVersion", { version })}
							</span>
						</div>
						{updateCheckResult?.status === "upToDate" ? (
							<p className="col-span-3 text-sm text-green-600">
								{t("app.settings.dialog.update.upToDate", {
									currentVersion: normalizeVersion(version),
									latestVersion: updateCheckResult.latestVersion,
								})}
							</p>
						) : null}
						{updateCheckResult?.status === "updateAvailable" ? (
							<div className="col-span-3 text-sm text-yellow-600 flex items-center gap-2">
								<span>
									{t("app.settings.dialog.update.updateAvailable", {
										currentVersion: normalizeVersion(version),
										latestVersion: updateCheckResult.latestVersion,
									})}
								</span>
								<a
									href={updateCheckResult.releaseUrl}
									target="_blank"
									rel="noreferrer"
									className="underline"
								>
									{t("app.settings.dialog.update.viewRelease")}
								</a>
							</div>
						) : null}
						{updateCheckResult?.status === "error" ? (
							<p className="col-span-3 text-sm text-red-600">
								{t("app.settings.dialog.update.checkFailed")}
							</p>
						) : null}
					</div>

					<div className="inline-flex sm:flex-row flex-col gap-2 mt-4">
						<Button type="button" onClick={openManageProjectsDialog}>
							{t("app.settings.dialog.manageProjects")}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
			<ManageProjectsDialog
				open={isManageProjectsOpen}
				onOpenChange={setIsManageProjectsOpen}
				onAddNewProjectClick={onAddProjectClick}
			/>
		</>
	);
}

export default Settings;
