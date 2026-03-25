import { LucideMoonStar, LucideSunMedium } from "lucide-react";
import useUserPreferences from "@/stores/user-preferences-store";
import type { Theme } from "@/types/theme";
import { Button } from "../button";

type Props = React.HTMLAttributes<HTMLButtonElement>;

function ThemeSwitch(props: Props) {
	const { theme, setTheme } = useUserPreferences();

	const themeMapping: Record<Theme, React.ReactNode> = {
		light: <LucideSunMedium />,
		dark: <LucideMoonStar />,
	};

	return (
		<Button
			variant="ghost"
			type="button"
			onClick={() => setTheme(theme === "light" ? "dark" : "light")}
			{...props}
		>
			{themeMapping[theme]}
		</Button>
	);
}

export default ThemeSwitch;
