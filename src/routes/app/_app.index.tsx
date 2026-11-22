import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Navbar } from "@/components/app-navbar";
import { CaaSParameters } from "@/components/caas-parameters";
import { NavServiceParameters } from "@/components/nav-service-parameters";
import { ParameterGroup } from "@/components/parameter-group";
import { ResponsePanel, type ServiceResult } from "@/components/response-panel";
import { ServiceSwitch } from "@/components/service-switch";
import { Button } from "@/components/ui/button";
import type { JsonView } from "@/components/ui/json-viewer";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Spinner } from "@/components/ui/spinner";
import { UrlDisplay } from "@/components/url-display";
import { resolveMode } from "@/lib/caas-api-keys";
import { buildCaaSRequest } from "@/lib/caas-request";
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

	// Only the latest request may update the view; older ones are aborted.
	const requestIdRef = useRef(0);
	const abortControllerRef = useRef<AbortController | null>(null);

	const {
		register,
		handleSubmit,
		setValue,
		getValues,
		reset,
		watch,
		formState: { errors },
	} = useForm<AppFormData>({
		defaultValues: { page: DEFAULT_PAGE, pagesize: DEFAULT_PAGE_SIZE },
	});
	const { locale, setLocale, mode, setMode, rep, count } =
		useSettingsStore();
	const navigate = useNavigate();

	const service = getService(selectedService);
	const result = results[selectedService];

	function cancelPendingRequest() {
		requestIdRef.current += 1;
		abortControllerRef.current?.abort();
		abortControllerRef.current = null;
		setIsExecuting(false);
	}

	useEffect(() => {
		isCaaSConfigStoreInitialized()
			? navigate({ to: "/app" })
			: navigate({ to: "/setup" });
	}, [navigate]);

	// Abort a running request when the page is left.
	useEffect(() => () => abortControllerRef.current?.abort(), []);

	// Filters, ids and routes belong to a project, so start fresh on a project switch.
	// biome-ignore lint/correctness/useExhaustiveDependencies: We need the customer props as trigger
	useEffect(() => {
		cancelPendingRequest();
		setResults(emptyResults);
		reset({ page: DEFAULT_PAGE, pagesize: getValues("pagesize") });
		setNavServiceRoute("");
		setNavServiceId("");
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

	// Re-run the request of the selected API when a setting or option changes,
	// but only once it has been executed manually. Typed inputs (identifiers,
	// routes, ids, paging, depth) are only sent on submit.
	// biome-ignore lint/correctness/useExhaustiveDependencies: onSubmit reads the latest values itself
	useEffect(() => {
		if (!results[selectedService]) return;
		handleSubmit(onSubmit)();
	}, [
		mode,
		locale,
		rep,
		count,
		navServiceOption,
		navServiceFormat,
		handleSubmit,
	]);

	/** Runs the request; resolves to false only if it failed, not if a newer request replaced it. */
	async function onSubmit(data: AppFormData): Promise<boolean> {
		const requestService = selectedService;
		let url: string;
		// The CaaS key of the current mode is also sent to the navigation service: it is
		// ignored by default, but a server can be configured to require it.
		const caasApiKey = projectSettings?.caasApiKeys[mode];

		if (requestService === "caas") {
			if (!projectSettings?.caasUrl || !caasApiKey) {
				toast.error(t("app.form.error.missingUrl"));
				return false;
			}
			url = buildCaaSRequest(projectSettings.caasUrl, mode, locale, data, {
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
			if (!requestUrl) {
				toast.error(t("app.form.error.missingNavServiceUrl"));
				return false;
			}
			url = requestUrl;
		}

		cancelPendingRequest();
		const requestId = requestIdRef.current;
		const controller = new AbortController();
		abortControllerRef.current = controller;
		const isLatest = () => requestIdRef.current === requestId;

		setIsExecuting(true);
		const startedAt = performance.now();

		try {
			const response = await fetch(url, {
				headers: caasApiKey
					? { Authorization: `Bearer ${caasApiKey}` }
					: undefined,
				signal: controller.signal,
			});
			if (!isLatest()) return true;

			if (!response.ok) {
				toast.error(
					t("app.form.error.requestFailed", {
						status: response.status,
						statusText: response.statusText,
					}),
				);
				return false;
			}

			const resData = await response.json();
			if (!isLatest()) return true;

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
			return true;
		} catch {
			if (!isLatest()) return true;
			toast.error(t("app.form.error.networkError"));
			return false;
		} finally {
			if (isLatest()) {
				abortControllerRef.current = null;
				setIsExecuting(false);
			}
		}
	}

	// The shown page number only changes once the new page has loaded.
	function paginate(direction: "next" | "previous") {
		const { currentPage, totalPages } = pageInfos;
		const nextPage =
			direction === "next"
				? Math.min(currentPage + 1, totalPages)
				: Math.max(currentPage - 1, 1);
		if (nextPage === currentPage) return;

		setValue("page", nextPage, { shouldValidate: true });
		handleSubmit(async (data) => {
			const succeeded = await onSubmit(data);
			if (!succeeded) setValue("page", currentPage, { shouldValidate: true });
		})();
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

	const responsePanel = (
		<ResponsePanel
			selectedService={selectedService}
			result={result}
			pageInfos={pageInfos}
			onPaginate={paginate}
			jsonView={jsonView}
			onJsonViewChange={setJsonView}
		/>
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
