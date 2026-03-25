import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@components/ui/tooltip";
import { Description } from "@radix-ui/react-dialog";
import { useNavigate } from "@tanstack/react-router";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { SaveConfigToJson } from "@/lib/config";
import { useCaaSConfigStore } from "@/stores/caas-config-store";
import { useSettingsStore } from "@/stores/settings-store";
import Icon from "./icons/icon";
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

function Settings() {
	const { t } = useTranslation();

	const npId = useId();
	const repId = useId();
	const countId = useId();

	const { locale, setLocale, np, setNp, rep, setRep, count, setCount } =
		useSettingsStore();

	const { locales } = useCaaSConfigStore();
	const navigate = useNavigate();

	if (!locales) {
		return null;
	}

	if (!locale) {
		setLocale(locales[0]);
	}

	const switchProject = () => {
		useCaaSConfigStore.getState().clearStore();
		useSettingsStore.getState().clearStore();
		navigate({ to: "/setup" });
	};

	return (
		<Dialog>
			<DialogTrigger>
				<Button type="button" variant="ghost">
					<Icon icon="settings" />
				</Button>
			</DialogTrigger>
			<DialogContent>
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
						{t("app.settings.dialog.locale.label")}
					</h2>
					<div className="flex flex-col gap-1.5 col-span-3">
						<Select value={locale || locales[0]} onValueChange={setLocale}>
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

				<div className="inline-flex sm:flex-row flex-col gap-2 mt-4">
					<Button type="button" onClick={switchProject.bind(null)}>
						<Icon icon="arrows-left-right" className="size-4" />
						{t("app.settings.dialog.switchProject")}
					</Button>
					<Button
						type="button"
						onClick={() => {
							const store = useCaaSConfigStore.getState();
							SaveConfigToJson({
								projectSettings: store.projectSetupData,
								databaseSchemas: store.databaseSchemas,
								locales: store.locales,
							});
						}}
					>
						<Icon icon="download" className="size-4" />
						{t("app.settings.dialog.downloadConfig")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default Settings;
