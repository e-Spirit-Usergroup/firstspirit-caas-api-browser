import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModeType } from '@/types/mode';

interface SettingsState {
    locale: string | null;
    setLocale: (locale: string | null) => void;
    mode: ModeType;
    setMode: (mode: ModeType) => void;
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
            mode: 'preview',
            setMode: (mode) => set({ mode }),
            np: true,
            setNp: (np) => set({ np }),
            rep: false,
            setRep: (rep) => set({ rep }),
            count: true,
            setCount: (count) => set({ count }),
            clearStore: () =>
                set({
                    locale: null,
                    mode: 'preview',
                    np: true,
                    rep: false,
                    count: true,
                }),
        }),
        {
            name: 'settings-store',
            version: 1.2,
            migrate(persistedState: unknown, version: number) {
                if (version < 1.2) {
                    const state = persistedState as Omit<
                        SettingsState,
                        'mode' | `set${string}`
                    >;
                    return { ...state, mode: 'preview' as ModeType };
                }
                return persistedState as SettingsState;
            },
        }
    )
);
