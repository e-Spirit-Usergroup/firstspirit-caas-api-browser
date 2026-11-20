import { useTranslation } from "react-i18next";
import Icon from "@/components/icons/icon";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

type UrlDisplayProps = {
	url: string;
	onCopy: () => void;
};

function splitUrl(url: string) {
	try {
		const parsed = new URL(url);
		return {
			base: decodeURIComponent(`${parsed.origin}${parsed.pathname}`),
			params: [...parsed.searchParams.entries()],
		};
	} catch {
		return { base: decodeURIComponent(url), params: [] };
	}
}

function UrlDisplay({ url, onCopy }: UrlDisplayProps) {
	const { t } = useTranslation();
	const { base, params } = splitUrl(url);

	return (
		<div className="col-span-12 bg-blue-100 dark:bg-neutral-800 p-4 rounded-md text-blue-950 dark:text-blue-100">
			<span className="inline-flex items-center gap-1">
				<span className="font-semibold">{t("app.form.decodedUrl")}</span>
				<Tooltip>
					<TooltipTrigger
						render={
							<button
								type="button"
								onClick={onCopy}
								className="px-2.5 cursor-pointer"
								aria-label={t("app.form.copyUrlToClipboardBtn.label")}
							/>
						}
					>
						<Icon icon="clipboard" className="size-4" />
					</TooltipTrigger>
					<TooltipContent className="max-w-64">
						<p>{t("app.form.copyUrlToClipboardBtn.label")}</p>
					</TooltipContent>
				</Tooltip>
			</span>
			{url ? (
				<span className="mt-2 block bg-neutral-300 text-neutral-700 dark:bg-neutral-900 dark:text-blue-400 px-3 py-2 text-sm leading-relaxed font-mono break-all rounded-sm">
					{base}
					{params.map(([key, value], index) => (
						<span key={`${key}=${value}`}>
							<span className="text-neutral-600 dark:text-neutral-400">
								{index === 0 ? "?" : "&"}
							</span>
							<span className="font-semibold text-violet-800 dark:text-violet-300">
								{key}
							</span>
							<span className="text-neutral-600 dark:text-neutral-400">=</span>
							<span className="font-semibold text-neutral-900 dark:text-neutral-100">
								{value}
							</span>
						</span>
					))}
				</span>
			) : (
				<span className="mt-2 block p-1.5 text-sm italic text-neutral-400 dark:text-neutral-500">
					{t("app.form.noUrlToDisplay")}
				</span>
			)}
		</div>
	);
}

export { UrlDisplay };
