import { useTranslation } from "react-i18next";
import { cn } from "@/lib/tw-utils";
import { useCaaSConfigStore } from "@/stores/caas-config-store";
import { version } from "../../package.json";
import Settings from "./settings";
import LanguageSwitch from "./ui/language-switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import ThemeSwitch from "./ui/theme-switch/theme-switch";

type Props = React.HTMLAttributes<HTMLDivElement>;

export function Navbar({ className, ...props }: Props) {
	const { projectSetupData } = useCaaSConfigStore();
	const { t } = useTranslation();
	const customerName = projectSetupData?.customerName?.trim().toUpperCase();
	const stage = projectSetupData?.stage?.toUpperCase();
	const projectName = projectSetupData?.projectName?.trim();
	const displayProjectName =
		customerName && stage && projectName
			? `${customerName} ${stage}: ${projectName}`
			: projectName || "";

	return (
		<header className={cn("flex flex-col", className)} {...props}>
			<div className="flex gap-4 items-center justify-between mb-4">
				<h1 className="text-xl font-bold">{`FirstSpirit CaaS API Browser v${version}`}</h1>
				<div className="flex gap-0 items-center ml-auto">
					<LanguageSwitch />
					<ThemeSwitch />
					<Settings />
				</div>
			</div>

			<div className="inline-flex items-center gap-2">
				{t("app.form.project")}:
				<Select value={projectSetupData?.caasUrl || ""}>
					<SelectTrigger>
						<SelectValue placeholder="Select a project" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={projectSetupData?.caasUrl || ""}>
							{displayProjectName}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</header>
	);
}
