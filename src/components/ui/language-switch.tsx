import { useTranslation } from "react-i18next";
import { cn } from "@/lib/tw-utils";
import useUserPreferences from "@/stores/user-preferences-store";
import Icon from "../icons/icon";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./select";

const languages = [
	{ code: "en", label: "English", flag: "fi fi-gb" },
	{ code: "de", label: "Deutsch", flag: "fi fi-de" },
	{ code: "it", label: "Italiano", flag: "fi fi-it" },
];

function LanguageSwitch({ ...props }: React.HTMLAttributes<HTMLDivElement>) {
	const { i18n } = useTranslation();
	const { language, setLanguage } = useUserPreferences();

	return (
		<div {...props}>
			<Select
				value={language}
				onValueChange={(val) => {
					i18n.changeLanguage(val);
					setLanguage(val as typeof language);
				}}
			>
				<SelectTrigger className="shadow-none! border-none! bg-transparent!">
					{/* <SelectValue /> */}
					<Icon icon="translate" className="size-5" />
				</SelectTrigger>
				<SelectContent>
					{languages.map((lang) => (
						<SelectItem key={lang.code} value={lang.code}>
							<span className={cn("me-1.5 rounded-xs", lang.flag)} />
							{lang.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

export default LanguageSwitch;
