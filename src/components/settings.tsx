import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAvailableModes } from "@/lib/caas-api-keys";
import {
	getActiveProjectFromState,
	useCaaSConfigStore,
} from "@/stores/caas-config-store";
import { useSettingsStore } from "@/stores/settings-store";
import { type ModeType, modeTypes } from "@/types/mode";
import { type StageType, stageTypes } from "@/types/stage";
import Icon from "./icons/icon";
import ManageProjectsDialog from "./manage-projects-dialog";
import { ProjectSettingsSection } from "./project-settings-section";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { UpdateSection } from "./update-section";

function Settings() {
	const { t } = useTranslation();

	const { locale, setLocale, mode, setMode } = useSettingsStore();

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

	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isManageProjectsOpen, setIsManageProjectsOpen] = useState(false);

	// Local state for deferred save
	const [localCustomerName, setLocalCustomerName] = useState(
		activeSelection?.customerName ?? "",
	);
	const [localStage, setLocalStage] = useState<StageType>(
		(activeSelection?.stage as StageType) ?? "dev",
	);
	const [localProjectName, setLocalProjectName] = useState(
		activeSelection?.projectName ?? "",
	);
	const [localLocale, setLocalLocale] = useState(locale ?? locales[0] ?? "");
	const [localMode, setLocalMode] = useState<ModeType>(mode);

	// Sync local state from store when dialog opens
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only sync on open
	useEffect(() => {
		if (isSettingsOpen) {
			setLocalCustomerName(activeSelection?.customerName ?? "");
			setLocalStage((activeSelection?.stage as StageType) ?? "dev");
			setLocalProjectName(activeSelection?.projectName ?? "");
			setLocalLocale(locale ?? locales[0] ?? "");
			setLocalMode(mode);
		}
	}, [isSettingsOpen]);

	// Derive options from local state
	const customerOptions = customers.map((customer) => customer.customerName);
	const localSelectedCustomer = customers.find(
		(customer) => customer.customerName === localCustomerName,
	);
	const localStageOptions = localSelectedCustomer
		? (Object.keys(localSelectedCustomer.stages) as StageType[]).filter(
				(stage) => localSelectedCustomer.stages[stage].length > 0,
			)
		: [];
	const localProjectOptions = localSelectedCustomer
		? (localSelectedCustomer.stages[localStage] ?? [])
		: [];
	const localProject = localProjectOptions.find(
		(p) => p.projectName === localProjectName,
	);
	const localProjectLocales = localProject?.locales ?? locales;
	const localAvailableModes = localProject
		? getAvailableModes(localProject.caasApiKeys)
		: [...modeTypes];
	// Fall back to a mode the selected project has an API key for
	const effectiveLocalMode = localAvailableModes.includes(localMode)
		? localMode
		: (localAvailableModes[0] ?? localMode);

	const handleCustomerChange = (value: string) => {
		const customer = customers.find((item) => item.customerName === value);
		const firstStage =
			stageTypes.find((stage) => customer?.stages[stage].length) ?? "dev";
		setLocalCustomerName(value);
		setLocalStage(firstStage);
		setLocalProjectName("");
	};

	const handleStageChange = (value: StageType) => {
		setLocalProjectName("");
		setLocalStage(value);
	};

	const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setActiveCustomer(localCustomerName);
		setActiveStage(localStage);
		setActiveProject(localProjectName);
		setLocale(localLocale);
		setMode(effectiveLocalMode);
		setIsSettingsOpen(false);
	};

	const onAddProjectClick = () => {
		setIsSettingsOpen(false);
		setIsManageProjectsOpen(false);
	};

	const openManageProjectsDialog = () => {
		setIsSettingsOpen(false);
		setIsManageProjectsOpen(true);
	};

	return (
		<>
			<Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
				<DialogTrigger render={<Button type="button" variant="ghost" />}>
					<Icon icon="settings" />
				</DialogTrigger>
				<DialogContent className="sm:max-w-2xl w-[95vw]">
					<form onSubmit={handleSave}>
						<DialogHeader>
							<DialogTitle>{t("app.settings.dialog.title")}</DialogTitle>
							<DialogDescription>
								{t("app.settings.dialog.subtitle")}
							</DialogDescription>
						</DialogHeader>

						<ProjectSettingsSection
							localCustomerName={localCustomerName}
							localStage={localStage}
							localProjectName={localProjectName}
							localLocale={localLocale}
							localMode={effectiveLocalMode}
							customerOptions={customerOptions}
							stageOptions={localStageOptions}
							projectOptions={localProjectOptions}
							localeOptions={localProjectLocales}
							availableModes={localAvailableModes}
							onCustomerChange={handleCustomerChange}
							onStageChange={handleStageChange}
							onProjectChange={setLocalProjectName}
							onLocaleChange={setLocalLocale}
							onModeChange={setLocalMode}
							onManageProjects={openManageProjectsDialog}
						/>

						<hr className="border-t my-4" />

						<UpdateSection />

						<hr className="border-t my-4" />
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsSettingsOpen(false)}
							>
								{t("app.settings.dialog.cancel")}
							</Button>
							<Button type="submit" disabled={!localProjectName}>
								{t("app.settings.dialog.save")}
							</Button>
						</DialogFooter>
					</form>
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
