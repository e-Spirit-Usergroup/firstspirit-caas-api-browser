import { useTranslation } from "react-i18next";
import { JSONTree } from "react-json-tree";
import Icon from "@/components/icons/icon";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { JSONViewerTheme } from "@/lib/json-viewer-config";
import { cn } from "@/lib/tw-utils";

type Props = {
	// biome-ignore lint/suspicious/noExplicitAny: explicit any type allowed
	json?: any;
	className?: string;
	onCopy?: () => void;
};

export default function JSONViewer({ json, className, onCopy }: Props) {
	const { t } = useTranslation();
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
					<JSONTree
						data={json}
						theme={JSONViewerTheme}
						invertTheme={false}
						collectionLimit={10}
						hideRoot={true}
						shouldExpandNodeInitially={() => true}
					/>
				</>
			)}
		</div>
	);
}
