import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
	locale: string | null;
	setLocale: (locale: string | null) => void;
	np: boolean;
	setNp: (np: boolean) => void;
	rep: boolean;
	setRep: (rep: boolean) => void;
	count: boolean;
	setCount: (count: boolean) => void;
	clearStore: () => void;
}

export const useSettingsStore = create<SettingsState>()(
	persist(
		(set) => ({
			locale: null,
			setLocale: (locale) => set({ locale }),
			np: true,
			setNp: (np) => set({ np }),
			rep: false,
			setRep: (rep) => set({ rep }),
			count: true,
			setCount: (count) => set({ count }),
			clearStore: () =>
				set({
					locale: null,
					np: true,
					rep: false,
					count: true,
				}),
		}),
		{
			name: "settings-store",
			version: 1.1,
		},
	),
);
