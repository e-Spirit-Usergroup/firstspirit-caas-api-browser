import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language } from "@/types/language";
import type { Theme } from "@/types/theme";

export const DEFAULT_LANGUAGE: Language = "en";
export const DEFAULT_THEME: Theme = "light";

const updateBodyTheme = (theme: Theme) => {
	if (typeof document === "undefined") return;
	if (theme === "dark") {
		document.body.classList.add("dark");
	} else {
		document.body.classList.remove("dark");
	}
};

interface UserPreferencesState {
	language: Language;
	setLanguage: (language: Language) => void;
	theme: Theme;
	setTheme: (theme: Theme) => void;
}

const useUserPreferences = create<UserPreferencesState>()(
	persist(
		(set) => ({
			language: DEFAULT_LANGUAGE,
			setLanguage: (language: Language) => set({ language }),
			theme: DEFAULT_THEME,
			setTheme: (theme: Theme) => {
				set({ theme });
				updateBodyTheme(theme);
			},
		}),
		{
			name: "user-preferences-store",
			version: 1.0,
		},
	),
);

if (typeof document !== "undefined") {
	updateBodyTheme(useUserPreferences.getState().theme);
}

export default useUserPreferences;
