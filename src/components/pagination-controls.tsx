import { useTranslation } from "react-i18next";
import Icon from "@/components/icons/icon";
import { Button } from "@/components/ui/button";
import type { PageInfos } from "@/types/page-infos";

type PaginationControlsProps = {
	pageInfos: PageInfos;
	onPrevious: () => void;
	onNext: () => void;
};

function PaginationControls({
	pageInfos,
	onPrevious,
	onNext,
}: PaginationControlsProps) {
	const { t } = useTranslation();

	return (
		<div className="flex w-full items-center justify-between mt-2">
			<Button
				variant="ghost"
				size="default"
				className="text-primary"
				onClick={onPrevious}
				disabled={pageInfos.currentPage <= 1}
			>
				<Icon icon="caret-left" className="size-4" />
				{t("app.pagination.previous")}
			</Button>
			<span className="text-sm">
				{t("app.pagination.pageXOfY", {
					x: pageInfos.currentPage,
					y: pageInfos.totalPages,
				})}
			</span>
			<Button
				variant="ghost"
				size="default"
				className="text-primary"
				onClick={onNext}
				disabled={pageInfos.currentPage >= pageInfos.totalPages}
			>
				{t("app.pagination.next")}
				<Icon icon="caret-right" className="size-4" />
			</Button>
		</div>
	);
}

export { PaginationControls };
