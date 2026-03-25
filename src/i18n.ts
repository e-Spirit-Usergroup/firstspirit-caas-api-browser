import i18n from "i18next";

import Backend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
import useUserPreferences, {
	DEFAULT_LANGUAGE,
} from "./stores/user-preferences-store";

const initialLanguage =
	useUserPreferences.getState().language || DEFAULT_LANGUAGE;

i18n
	.use(Backend)
	.use(initReactI18next)
	.init({
		lng: initialLanguage,
		fallbackLng: DEFAULT_LANGUAGE,
		debug: true,

		interpolation: {
			escapeValue: false, // not needed for react as it escapes by default
		},
	});

if (typeof document !== "undefined") {
	document.documentElement.lang = i18n.language;

	i18n.on("languageChanged", (lng) => {
		document.documentElement.lang = lng;
	});
}

export default i18n;
