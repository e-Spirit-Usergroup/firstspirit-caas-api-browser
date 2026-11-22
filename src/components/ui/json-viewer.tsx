import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/icons/icon";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	countJsonNodes,
	PREVIEW_NODE_LIMIT,
	truncateJson,
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

export default function JSONViewer({
	json,
	className,
	onCopy,
	view = "tree",
}: Props) {
	const { t } = useTranslation();

	// Remember which response was fully expanded, so a new response starts as a preview again
	const [expandedJson, setExpandedJson] = useState<unknown>(null);
	const isExpanded = expandedJson === json;

	const totalNodes = useMemo(
		() => (json == null ? 0 : countJsonNodes(json)),
		[json],
	);
	const isTruncated = totalNodes > PREVIEW_NODE_LIMIT && !isExpanded;
	const displayedJson = useMemo(
		() => (isTruncated ? truncateJson(json, PREVIEW_NODE_LIMIT) : json),
		[json, isTruncated],
	);

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
					{view === "raw" ? (
						<RawJson json={displayedJson} />
					) : (
						<JsonTreeView data={displayedJson} />
					)}
					{isTruncated && (
						<div className="mt-4 mb-2 flex flex-col items-center gap-3 border-t border-white/10 pt-5 text-center">
							<p className="text-sm text-neutral-400">
								{t("app.json.preview", {
									shown: PREVIEW_NODE_LIMIT.toLocaleString(),
									total: totalNodes.toLocaleString(),
								})}
							</p>
							<button
								type="button"
								onClick={() => setExpandedJson(json)}
								className="h-10 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-medium text-neutral-100 transition-colors hover:bg-white/10"
							>
								{t("app.json.showAll")}
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
