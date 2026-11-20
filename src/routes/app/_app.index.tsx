import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Navbar } from "@/components/app-navbar";
import { CaaSParameters } from "@/components/caas-parameters";
import Icon from "@/components/icons/icon";
import { NavServiceParameters } from "@/components/nav-service-parameters";
import { PaginationControls } from "@/components/pagination-controls";
import { ParameterGroup } from "@/components/parameter-group";
import { ServiceSwitch } from "@/components/service-switch";
import { Button } from "@/components/ui/button";
import JSONViewer, { type JsonView } from "@/components/ui/json-viewer";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Spinner } from "@/components/ui/spinner";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { UrlDisplay } from "@/components/url-display";
import { resolveMode } from "@/lib/caas-api-keys";
import { buildCaaSRequest } from "@/lib/caas-request";
import { JSONViewerTheme } from "@/lib/json-viewer-config";
import type {
	NavServiceFormat,
	NavServiceOption,
} from "@/lib/nav-service-request";
import { buildNavServiceRequest } from "@/lib/nav-service-request";
import { getService, type Service } from "@/lib/services";
import { cn } from "@/lib/tw-utils";
import {
	getActiveProjectFromState,
	isCaaSConfigStoreInitialized,
	useCaaSConfigStore,
} from "@/stores/caas-config-store";
import { useSettingsStore } from "@/stores/settings-store";
import {
	type AppFormData,
	DEFAULT_PAGE,
	DEFAULT_PAGE_SIZE,
} from "@/types/app-form";
import type { PageInfos } from "@/types/page-infos";
import { stageColors, stageOptionTexts } from "@/types/stage";

export const Route = createFileRoute("/app/_app/")({
	component: RouteComponent,
});

type ServiceResult = {
	url: string;
	// biome-ignore lint/suspicious/noExplicitAny: arbitrary JSON response
	data: any;
	status: string;
	durationMs: number;
};

const emptyResults: Record<Service, ServiceResult | null> = {
	caas: null,
	"navigation-service": null,
};

function RouteComponent() {
	const { t } = useTranslation();
	const formId = useId();

	const { customers, activeSelection } = useCaaSConfigStore();
	const projectSettings = useMemo(
		() => getActiveProjectFromState({ customers, activeSelection }),
		[customers, activeSelection],
	);
	const databaseSchemas = projectSettings?.databaseSchemas;

	const [results, setResults] = useState(emptyResults);
	const [selectedService, setSelectedService] = useState<Service>("caas");
	const [navServiceOption, setNavServiceOption] =
		useState<NavServiceOption>("full-navigation");
	const [navServiceFormat, setNavServiceFormat] =
		useState<NavServiceFormat>("default");
	const [navServiceDepth, setNavServiceDepth] = useState("");
	const [navServiceRoute, setNavServiceRoute] = useState("");
	const [navServiceId, setNavServiceId] = useState("");
	const [pageInfos, setPageInfos] = useState<PageInfos>({
		totalPages: 0,
		currentPage: 1,
	});
	const [isExecuting, setIsExecuting] = useState(false);
	const [jsonView, setJsonView] = useState<JsonView>("tree");

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<AppFormData>({
		defaultValues: { page: DEFAULT_PAGE, pagesize: DEFAULT_PAGE_SIZE },
	});
	const { locale, setLocale, mode, setMode, np, rep, count } =
		useSettingsStore();
	const navigate = useNavigate();

	const service = getService(selectedService);
	const result = results[selectedService];

	useEffect(() => {
		isCaaSConfigStoreInitialized()
			? navigate({ to: "/app" })
			: navigate({ to: "/setup" });
	}, [navigate]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: We need the customer props as trigger
	useEffect(() => {
		setResults(emptyResults);
		setValue("page", DEFAULT_PAGE);
		setPageInfos({ totalPages: 0, currentPage: 1 });
	}, [
		activeSelection?.customerName,
		activeSelection?.stage,
		activeSelection?.projectName,
	]);

	useEffect(() => {
		const projectLocales = projectSettings?.locales ?? [];
		if (!projectLocales.length) return;
		if (!locale || !projectLocales.includes(locale)) {
			setLocale(projectLocales[0]);
		}
	}, [projectSettings?.locales, locale, setLocale]);

	// Switch to a mode the active project has an API key for
	useEffect(() => {
		const availableMode = resolveMode(projectSettings?.caasApiKeys, mode);
		if (availableMode && availableMode !== mode) {
			setMode(availableMode);
		}
	}, [projectSettings?.caasApiKeys, mode, setMode]);

	// Re-run the request of the selected API when its parameters change,
	// but only once it has been executed manually.
	// biome-ignore lint/correctness/useExhaustiveDependencies: <>
	useEffect(() => {
		if (!results[selectedService]) return;
		handleSubmit(onSubmit)();
	}, [
		mode,
		locale,
		np,
		rep,
		count,
		navServiceOption,
		navServiceFormat,
		navServiceDepth,
		navServiceRoute,
		navServiceId,
		handleSubmit,
	]);

	async function onSubmit(data: AppFormData) {
		const requestService = selectedService;
		let url: string;
		let caasApiKey: string | undefined;

		if (requestService === "caas") {
			caasApiKey = projectSettings?.caasApiKeys[mode];
			if (!projectSettings?.caasUrl || !caasApiKey) {
				toast.error(t("app.form.error.missingUrl"));
				return;
			}
			url = buildCaaSRequest(projectSettings.caasUrl, mode, locale, data, {
				np,
				rep,
				count,
			});
		} else {
			const requestUrl = buildNavServiceRequest(
				projectSettings?.navigationServiceUrl,
				mode,
				navServiceOption,
				navServiceFormat,
				locale,
				navServiceDepth,
				navServiceRoute,
				navServiceId,
			);
			if (!requestUrl) return;
			url = requestUrl;
		}

		setIsExecuting(true);
		const startedAt = performance.now();

		try {
			const response = await fetch(url, {
				headers: caasApiKey
					? { Authorization: `Bearer ${caasApiKey}` }
					: undefined,
			});

			if (!response.ok) {
				toast.error(
					t("app.form.error.requestFailed", {
						status: response.status,
						statusText: response.statusText,
					}),
				);
				return;
			}

			const resData = await response.json();

			if (requestService === "caas") {
				setPageInfos({
					totalPages: resData._total_pages,
					currentPage: data.page,
				});
			}
			setResults((prev) => ({
				...prev,
				[requestService]: {
					url,
					data: resData,
					status: `${response.status} ${response.statusText || "OK"}`,
					durationMs: Math.round(performance.now() - startedAt),
				},
			}));
		} catch {
			toast.error(t("app.form.error.networkError"));
		} finally {
			setIsExecuting(false);
		}
	}

	function paginate(direction: "next" | "previous") {
		const { currentPage, totalPages } = pageInfos;
		const nextPage =
			direction === "next"
				? Math.min(currentPage + 1, totalPages)
				: Math.max(currentPage - 1, 1);
		if (nextPage === currentPage) return;

		setValue("page", nextPage, { shouldValidate: true });
		setPageInfos((prev) => ({ ...prev, currentPage: nextPage }));
		handleSubmit(onSubmit)();
	}

	async function onCopyUrl() {
		if (!result?.url) {
			toast.error(t("app.form.copyUrlToClipboardBtn.error"));
			return;
		}
		try {
			await navigator.clipboard.writeText(result.url);
			toast.success(t("app.form.copyUrlToClipboardBtn.success"));
		} catch {
			toast.error(t("app.form.copyUrlToClipboardBtn.error"));
		}
	}

	async function onCopyJson() {
		if (!result) {
			toast.error(t("app.form.copyJsonToClipboardBtn.error"));
			return;
		}
		try {
			await navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
			toast.success(t("app.form.copyJsonToClipboardBtn.success"));
		} catch {
			toast.error(t("app.form.copyJsonToClipboardBtn.error"));
		}
	}

	function resultSummary(): string | null {
		const data = result?.data;
		if (!data) return null;
		if (selectedService === "caas" && typeof data._size === "number") {
			return t("app.response.caasSummary", {
				total: data._size,
				returned: data._returned ?? 0,
			});
		}
		if (
			selectedService === "navigation-service" &&
			Array.isArray(data.children)
		) {
			return t("app.response.navSummary", { count: data.children.length });
		}
		return null;
	}

	const formPanel = (
		<div className="flex h-full flex-col">
			<div className="flex-1 overflow-y-scroll no-scrollbar p-4">
				<Navbar />
				<span
					className={cn(
						"inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium inset-ring mb-4",
						activeSelection?.stage && stageColors[activeSelection.stage],
					)}
				>
					<span>
						{activeSelection?.customerName}{" "}
						{activeSelection?.stage &&
							`${stageOptionTexts[activeSelection.stage]} `}
						| {activeSelection?.projectName}
					</span>
					<span className="rounded-sm bg-gray-700 px-1 py-0.5 text-xs text-gray-100">
						{mode?.toUpperCase()}
					</span>
				</span>
				<form
					id={formId}
					onSubmit={handleSubmit(onSubmit)}
					className="grid grid-cols-12 gap-5"
				>
					<ServiceSwitch
						value={selectedService}
						onChange={setSelectedService}
					/>
					<UrlDisplay url={result?.url ?? ""} onCopy={onCopyUrl} />
					{selectedService === "caas" ? (
						<ParameterGroup title={t("app.form.service.caasParameters")}>
							<CaaSParameters
								databaseSchemas={databaseSchemas}
								register={register}
								setValue={setValue}
								watch={watch}
								errors={errors}
							/>
						</ParameterGroup>
					) : (
						<ParameterGroup title={t("app.form.service.navParameters")}>
							<NavServiceParameters
								selectedOption={navServiceOption}
								onOptionChange={setNavServiceOption}
								selectedFormat={navServiceFormat}
								onFormatChange={setNavServiceFormat}
								depth={navServiceDepth}
								onDepthChange={setNavServiceDepth}
								route={navServiceRoute}
								onRouteChange={setNavServiceRoute}
								id={navServiceId}
								onIdChange={setNavServiceId}
							/>
						</ParameterGroup>
					)}
				</form>
			</div>
			<div className="border-t bg-background px-4 pt-3.5 pb-4">
				<Button
					type="submit"
					form={formId}
					variant="default"
					disabled={isExecuting}
					aria-busy={isExecuting}
					className={cn(
						"h-11 gap-2.5 px-5 text-base font-semibold",
						service.glowClass,
					)}
				>
					{isExecuting ? (
						<Spinner
							data-icon="inline-start"
							aria-label={t("app.common.loading")}
						/>
					) : (
						<ArrowRight className="size-4.5" data-icon="inline-start" />
					)}
					<span>{t("app.settings.executeRequest")}</span>
				</Button>
			</div>
		</div>
	);

	const summary = resultSummary();

	const responsePanel = (
		<div className="flex h-full flex-col gap-2 overflow-hidden p-2">
			<div
				className={cn(
					"flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border-t-6",
					service.panelBorderClass,
				)}
				style={{ backgroundColor: JSONViewerTheme.base00 }}
			>
				{result ? (
					<>
						<div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-2.5 text-sm text-neutral-300">
							<div className="flex flex-wrap items-center gap-3.5">
								<span className="rounded bg-green-950 px-2 py-0.5 font-semibold text-green-300">
									{result.status}
								</span>
								<span>
									{t("app.response.duration", { ms: result.durationMs })}
								</span>
								{summary && <span>{summary}</span>}
							</div>
							<div className="flex items-center gap-2">
								<div
									role="tablist"
									aria-label={t("app.json.view.label")}
									className="flex gap-1 rounded-lg bg-black/25 p-1"
								>
									{(["tree", "raw"] as const).map((view) => (
										<button
											key={view}
											type="button"
											role="tab"
											aria-selected={jsonView === view}
											onClick={() => setJsonView(view)}
											className={cn(
												"h-8 rounded-md px-3.5 text-sm transition-colors",
												jsonView === view
													? "bg-white/15 font-semibold text-white"
													: "font-medium text-neutral-300 hover:text-white",
											)}
										>
											{t(`app.json.view.${view}`)}
										</button>
									))}
								</div>
								<Tooltip>
									<TooltipTrigger
										render={
											<button
												type="button"
												onClick={onCopyJson}
												className="flex size-10 items-center justify-center rounded-md text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
												aria-label={t("app.form.copyJsonToClipboardBtn.label")}
											/>
										}
									>
										<Icon icon="clipboard" className="size-5" />
									</TooltipTrigger>
									<TooltipContent className="max-w-64">
										<p>{t("app.form.copyJsonToClipboardBtn.label")}</p>
									</TooltipContent>
								</Tooltip>
							</div>
						</div>
						<JSONViewer
							json={result.data}
							view={jsonView}
							className="flex-1 overflow-y-scroll no-scrollbar rounded-none px-5 py-3"
						/>
					</>
				) : (
					<div className="flex flex-1 flex-col items-center justify-center gap-2.5 p-6 text-center text-neutral-400">
						<ArrowRight
							className="size-10 text-neutral-500"
							strokeWidth={1.5}
						/>
						<span className="text-base font-medium text-neutral-200">
							{t("app.response.emptyTitle", { api: service.label })}
						</span>
						<span className="text-sm">{t("app.response.emptyHint")}</span>
					</div>
				)}
			</div>
			{selectedService === "caas" && result && pageInfos.totalPages > 1 && (
				<div className="shrink-0">
					<PaginationControls
						pageInfos={pageInfos}
						onPrevious={() => paginate("previous")}
						onNext={() => paginate("next")}
					/>
				</div>
			)}
		</div>
	);

	return (
		<>
			{/* Mobile: stacked layout */}
			<div className="flex h-full w-full flex-col lg:hidden">
				{formPanel}
				{responsePanel}
			</div>

			{/* Desktop: resizable panels */}
			<div className="hidden h-svh w-full lg:block">
				<ResizablePanelGroup orientation="horizontal">
					<ResizablePanel defaultSize="40%" minSize="20%" maxSize="65%">
						{formPanel}
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize="60%" minSize="20%">
						{responsePanel}
					</ResizablePanel>
				</ResizablePanelGroup>
			</div>
		</>
	);
}
