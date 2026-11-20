import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Icon from "@/components/icons/icon";
import { PaginationControls } from "@/components/pagination-controls";
import JSONViewer, { type JsonView } from "@/components/ui/json-viewer";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { JSONViewerTheme } from "@/lib/json-viewer-config";
import { getService, type Service } from "@/lib/services";
import { cn } from "@/lib/tw-utils";
import type { PageInfos } from "@/types/page-infos";

export type ServiceResult = {
	url: string;
	// biome-ignore lint/suspicious/noExplicitAny: arbitrary JSON response
	data: any;
	status: string;
	durationMs: number;
};

type ResponsePanelProps = {
	selectedService: Service;
	result: ServiceResult | null;
	pageInfos: PageInfos;
	onPaginate: (direction: "next" | "previous") => void;
	jsonView: JsonView;
	onJsonViewChange: (view: JsonView) => void;
};

function ResponsePanel({
	selectedService,
	result,
	pageInfos,
	onPaginate,
	jsonView,
	onJsonViewChange: setJsonView,
}: ResponsePanelProps) {
	const { t } = useTranslation();
	const service = getService(selectedService);

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

	const summary = resultSummary();

	return (
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
						onPrevious={() => onPaginate("previous")}
						onNext={() => onPaginate("next")}
					/>
				</div>
			)}
		</div>
	);
}

export { ResponsePanel };
