import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeState {
    mode: ThemeMode;
    primaryColor: string;

    // Actions
    setMode: (mode: ThemeMode) => void;
    setPrimaryColor: (color: string) => void;
    toggleMode: () => void;
    applyTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            mode: 'light',
            primaryColor: '#0ea5e9',

            setMode: (mode) => {
                set({ mode });
                get().applyTheme();
            },

            setPrimaryColor: (primaryColor) => {
                set({ primaryColor });
                document.documentElement.style.setProperty('--primary', primaryColor);
            },

            toggleMode: () => {
                const { mode } = get();
                const newMode = mode === 'light' ? 'dark' : 'light';
                set({ mode: newMode });
                get().applyTheme();
            },

            applyTheme: () => {
                const { mode } = get();
                const root = document.documentElement;

                if (mode === 'auto') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    root.classList.toggle('dark', prefersDark);
                } else {
                    root.classList.toggle('dark', mode === 'dark');
                }
            },
        }),
        {
            name: 'theme-storage',
            onRehydrateStorage: () => (state) => {
                // Apply theme after rehydration
                state?.applyTheme();
            },
        }
    )
);
