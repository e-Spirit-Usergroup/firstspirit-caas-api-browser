import { cn } from "@/lib/tw-utils";
import Icon from "./icons/icon";

export function Footer({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	const getYearDisplay = (baseYear: number = 2026): string => {
		const currentYear = new Date().getFullYear();

		return currentYear > baseYear
			? `${baseYear} - ${currentYear}`
			: `${baseYear}`;
	};

	return (
		<footer
			className={cn(
				"bg-neutral-900 dark:bg-neutral-900 w-full flex items-center justify-center border-t px-6 py-2 text-center text-sm text-neutral-200 dark:text-neutral-200",
				className,
			)}
			{...props}
		>
			<span className="flex items-center gap-2">
				<span>&copy; {getYearDisplay()}</span>
				<a
					href="https://neoreply.de/"
					target="_blank"
					rel="noopener noreferrer external"
					className="flex items-center gap-2 font-semibold transition-colors hover:text-neo hover:underline"
				>
					<Icon className="size-4" icon={"running-man"} />
					Neo Reply
				</a>
			</span>
		</footer>
	);
}
