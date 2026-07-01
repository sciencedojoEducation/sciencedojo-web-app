"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_THEME,
  EXAM_THEME,
  LEGACY_THEME_STORAGE_KEY,
  THEME_STORAGE_KEY,
  THEMES,
  examSilenceTheme,
  getFocusTheme,
  getSelectableTheme,
  normalizeSelectableThemeId,
  normalizeThemeId,
  type SelectableThemeId,
  type Theme,
  type ThemeId,
} from "./themes";

type ApplyThemeOptions = {
  persist?: boolean;
};

type ThemeContextValue = {
  currentTheme: ThemeId;
  setTheme: (themeId: SelectableThemeId | string) => void;
  previewTheme: (themeId: SelectableThemeId | string) => void;
  restoreTheme: () => void;
  theme: Theme | typeof examSilenceTheme;
  isDark: boolean;
  enterExamMode: () => void;
  exitExamMode: () => void;
  isExamMode: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function metaColorForTheme(themeId: ThemeId) {
  if (themeId === EXAM_THEME) return "#18181B";
  return getSelectableTheme(themeId).previewColors.bg;
}

function updateMetaThemeColor(themeId: ThemeId) {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", metaColorForTheme(themeId));
  }
}

function firstVisitTheme() {
  if (typeof window === "undefined") return DEFAULT_THEME;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? DEFAULT_THEME
    : "daylight";
}

function freeSafeTheme(themeId: SelectableThemeId) {
  const theme = getSelectableTheme(themeId);
  return theme.minimumAccess === "pro" ? DEFAULT_THEME : theme.id;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(DEFAULT_THEME);
  const [persistedTheme, setPersistedTheme] =
    useState<SelectableThemeId>(DEFAULT_THEME);
  const [preExamTheme, setPreExamTheme] = useState<SelectableThemeId | null>(
    null,
  );
  const [isExamMode, setIsExamMode] = useState(false);
  const currentThemeRef = useRef<ThemeId>(DEFAULT_THEME);

  const applyTheme = useCallback(
    (themeId: SelectableThemeId | string, options: ApplyThemeOptions = {}) => {
      const normalized = normalizeThemeId(themeId);
      if (normalized === EXAM_THEME) return;
      if (!THEMES.some((theme) => theme.id === normalized)) return;

      const selectableTheme = normalized as SelectableThemeId;
      currentThemeRef.current = selectableTheme;
      setCurrentTheme((current) =>
        current === selectableTheme ? current : selectableTheme,
      );
      document.documentElement.setAttribute("data-theme", selectableTheme);
      updateMetaThemeColor(selectableTheme);

      if (options.persist) {
        setPersistedTheme((current) =>
          current === selectableTheme ? current : selectableTheme,
        );
        window.localStorage.setItem(THEME_STORAGE_KEY, selectableTheme);
        window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, selectableTheme);
      }
    },
    [],
  );

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    const legacy = window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    const initial = saved
      ? normalizeSelectableThemeId(saved)
      : legacy
        ? normalizeSelectableThemeId(legacy)
        : firstVisitTheme();
    const focusInitial = freeSafeTheme(initial);
    applyTheme(focusInitial, { persist: true });
  }, [applyTheme]);

  const setTheme = useCallback(
    (themeId: SelectableThemeId | string) => {
      applyTheme(themeId, { persist: true });
    },
    [applyTheme],
  );

  const previewTheme = useCallback((themeId: SelectableThemeId | string) => {
    const normalized = normalizeThemeId(themeId);
    if (normalized === EXAM_THEME) return;
    currentThemeRef.current = normalized;
    setCurrentTheme((current) => (current === normalized ? current : normalized));
    document.documentElement.setAttribute("data-theme", normalized);
    updateMetaThemeColor(normalized);
  }, []);

  const restoreTheme = useCallback(() => {
    currentThemeRef.current = persistedTheme;
    setCurrentTheme((current) =>
      current === persistedTheme ? current : persistedTheme,
    );
    document.documentElement.setAttribute("data-theme", persistedTheme);
    updateMetaThemeColor(persistedTheme);
  }, [persistedTheme]);

  const enterExamMode = useCallback(() => {
    const savedTheme = normalizeSelectableThemeId(
      window.localStorage.getItem(THEME_STORAGE_KEY) ??
        currentThemeRef.current ??
        DEFAULT_THEME,
    );
    setPreExamTheme(savedTheme);
    setIsExamMode(true);
    currentThemeRef.current = EXAM_THEME;
    setCurrentTheme((current) => (current === EXAM_THEME ? current : EXAM_THEME));
    document.documentElement.setAttribute("data-theme", EXAM_THEME);
    updateMetaThemeColor(EXAM_THEME);
  }, []);

  const exitExamMode = useCallback(() => {
    const restoreTo = normalizeSelectableThemeId(
      preExamTheme ??
        window.localStorage.getItem(THEME_STORAGE_KEY) ??
        persistedTheme ??
        DEFAULT_THEME,
    );
    setIsExamMode(false);
    setPreExamTheme(null);
    currentThemeRef.current = restoreTo;
    setCurrentTheme((current) => (current === restoreTo ? current : restoreTo));
    document.documentElement.setAttribute("data-theme", restoreTo);
    updateMetaThemeColor(restoreTo);
  }, [persistedTheme, preExamTheme]);

  const theme = useMemo(() => getFocusTheme(currentTheme), [currentTheme]);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        previewTheme,
        restoreTheme,
        theme,
        isDark: theme.isDark,
        enterExamMode,
        exitExamMode,
        isExamMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
