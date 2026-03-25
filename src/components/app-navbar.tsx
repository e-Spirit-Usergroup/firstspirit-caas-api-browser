import { cn } from "@/lib/tw-utils";
import { version } from "../../package.json";
import Settings from "./settings";
import LanguageSwitch from "./ui/language-switch";
import ThemeSwitch from "./ui/theme-switch/theme-switch";

type Props = React.HTMLAttributes<HTMLDivElement>;

export function Navbar({ className, ...props }: Props) {
	return (
		<header className={cn("flex flex-col", className)} {...props}>
			<div className="flex gap-4 items-center justify-between mb-4">
				<h1 className="text-xl font-bold">{`FirstSpirit CaaS API Browser ${version}`}</h1>
				<div className="flex gap-0 items-center ml-auto">
					<LanguageSwitch />
					<ThemeSwitch />
					<Settings />
				</div>
			</div>
		</header>
	);
}
