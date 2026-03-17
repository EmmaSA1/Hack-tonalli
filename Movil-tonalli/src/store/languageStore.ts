import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Lang, t } from "../i18n/translations";

interface LanguageState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  tr: (key: string, params?: Record<string, string | number>) => string;
  hydrate: () => Promise<void>;
}

const LANG_KEY = "tonalli_lang";

export const useLanguageStore = create<LanguageState>((set, get) => ({
  lang: "es",

  setLang: (lang: Lang) => {
    set({ lang });
    SecureStore.setItemAsync(LANG_KEY, lang).catch(() => {});
  },

  tr: (key: string, params?: Record<string, string | number>): string => {
    const { lang } = get();
    let text = t[lang]?.[key] ?? t.es[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  },

  hydrate: async () => {
    try {
      const saved = await SecureStore.getItemAsync(LANG_KEY);
      if (saved && (saved === "es" || saved === "en" || saved === "nah")) {
        set({ lang: saved });
      }
    } catch {}
  },
}));
