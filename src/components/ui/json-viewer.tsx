import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/icons/icon";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	computeInitialExpansion,
	EXPAND_ALL_ROW_BUDGET,
} from "@/lib/json-preview";
import { JSONViewerTheme } from "@/lib/json-viewer-config";
import { cn } from "@/lib/tw-utils";
import { JsonTreeView } from "./json-tree-view";
import { RawJson } from "./raw-json";

export type JsonView = "tree" | "raw";

type Props = {
	// biome-ignore lint/suspicious/noExplicitAny: explicit any type allowed
	json?: any;
	className?: string;
	onCopy?: () => void;
	view?: JsonView;
};

const responseIds = new WeakMap<object, number>();
let nextResponseId = 0;

/** Stable id per response object, so the tree remounts (and resets its expansion) for a new response. */
function getResponseId(json: unknown): number {
	if (json === null || typeof json !== "object") return -1;
	let id = responseIds.get(json);
	if (id === undefined) {
		id = nextResponseId++;
		responseIds.set(json, id);
	}
	return id;
}

export default function JSONViewer({
	json,
	className,
	onCopy,
	view = "tree",
}: Props) {
	const { t } = useTranslation();

	// Remember which response was expanded fully, so a new response starts as an overview again
	const [expandedJson, setExpandedJson] = useState<unknown>(null);
	const isExpandedAll = json != null && expandedJson === json;

	const initialExpansion = useMemo(
		() => (view === "tree" ? computeInitialExpansion(json) : null),
		[json, view],
	);
	const expandAllExpansion = useMemo(
		() =>
			view === "tree" && isExpandedAll
				? computeInitialExpansion(json, EXPAND_ALL_ROW_BUDGET)
				: null,
		[json, view, isExpandedAll],
	);
	const expansion = expandAllExpansion ?? initialExpansion;
	const isPartiallyExpanded =
		initialExpansion !== null && !initialExpansion.isComplete;

	let expansionHint = t("app.json.partiallyExpanded");
	if (expandAllExpansion) {
		expansionHint = expandAllExpansion.isComplete
			? t("app.json.expandedAll")
			: t("app.json.expandAllCapped");
	}

	return (
		<div
			className={cn(
				"text-sm sm:text-base lg:text-sm xl:text-base rounded-md p-2 w-full relative",
				className,
			)}
			style={{ backgroundColor: JSONViewerTheme.base00 }}
		>
			{json === null ? (
				<div className="flex flex-col items-center justify-center h-full">
					<div className="flex flex-col gap-2">
						<img
							src="/undraw/undraw_code-sample_kpju.svg"
							alt={t("app.json.codeSampleAlt")}
							className="w-full max-w-48 max-h-48 mx-auto mt-4"
						/>
						<p className="text-white">{t("app.json.noResponse")}</p>
					</div>
				</div>
			) : (
				<>
					{onCopy && (
						<div className="flex justify-end mb-1 absolute top-4 right-4">
							<Tooltip>
								<TooltipTrigger
									render={
										<button
											type="button"
											onClick={onCopy}
											className="px-2.5 py-1 cursor-pointer text-neutral-400 hover:text-neutral-200 transition-colors"
											aria-label={t("app.form.copyJsonToClipboardBtn.label")}
										/>
									}
								>
									<Icon icon="clipboard" className="size-6 text-white" />
								</TooltipTrigger>
								<TooltipContent className="max-w-64">
									<p>{t("app.form.copyJsonToClipboardBtn.label")}</p>
								</TooltipContent>
							</Tooltip>
						</div>
					)}
					{isPartiallyExpanded && (
						<div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
							<p className="text-xs text-neutral-400">{expansionHint}</p>
							<button
								type="button"
								onClick={() => setExpandedJson(isExpandedAll ? null : json)}
								className="h-7 cursor-pointer rounded-md border border-white/15 bg-white/5 px-3 text-xs font-medium text-neutral-100 transition-colors hover:bg-white/10"
							>
								{isExpandedAll
									? t("app.json.collapse")
									: t("app.json.expandAll")}
							</button>
						</div>
					)}
					{view === "raw" || !expansion ? (
						<RawJson json={json} />
					) : (
						<JsonTreeView
							key={`${getResponseId(json)}-${isExpandedAll ? "all" : "initial"}`}
							data={json}
							shouldExpand={expansion.shouldExpand}
						/>
					)}
				</>
			)}
		</div>
	);
}
