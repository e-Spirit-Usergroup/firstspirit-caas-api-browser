import { cn } from "@/lib/tw-utils";
import { version } from "../../package.json";
import LanguageSwitch from "./ui/language-switch";
import ThemeSwitch from "./ui/theme-switch/theme-switch";

type Props = React.HTMLAttributes<HTMLDivElement>;

function SetupNavbar({ className, ...props }: Props) {
	return (
		<header
			className={cn(
				"flex sm:flex-row flex-col bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm border-b p-4 sticky top-0 items-center",
				className,
			)}
			{...props}
		>
			<div className="flex gap-4">
				<h1 className="text-xl font-bold">{`FirstSpirit CaaS API Browser v${version}`}</h1>
			</div>
			<div className="sm:ml-auto flex gap-0 items-center justify-between">
				<LanguageSwitch />
				<ThemeSwitch />
			</div>
		</header>
	);
}

export default SetupNavbar;
