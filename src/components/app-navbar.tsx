import { Link } from "@tanstack/react-router";
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
				<Link
					to="/"
					className="text-xl font-bold"
				>{`FirstSpirit CaaS API Browser ${version}`}</Link>
				{/* gap-1 keeps each button's 3px focus ring clear of its neighbours */}
				<div className="flex gap-1 items-center ml-auto">
					<LanguageSwitch />
					<ThemeSwitch />
					<Settings />
				</div>
			</div>
		</header>
	);
}
