const THEME_STORAGE_KEY = "theme";
const DEFAULT_THEME = "light";

const getStoredTheme = (): string => {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  return window.localStorage.getItem(THEME_STORAGE_KEY) ?? DEFAULT_THEME;
};

const ensureThemeColorMeta = (): HTMLMetaElement | null => {
  if (typeof document === "undefined") {
    return null;
  }

  let metaThemeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;

  if (!metaThemeColor) {
    metaThemeColor = document.createElement("meta");
    metaThemeColor.name = "theme-color";
    document.head.appendChild(metaThemeColor);
  }

  return metaThemeColor;
};

const resolveThemeColor = (): string => {
  if (typeof document === "undefined") {
    return "#7C9E87";
  }

  const probe = document.createElement("div");
  probe.className = "bg-base-200";
  probe.style.position = "fixed";
  probe.style.opacity = "0";
  probe.style.pointerEvents = "none";
  probe.style.inset = "-9999px";

  document.body.appendChild(probe);

  const computedColor = window.getComputedStyle(probe).backgroundColor;

  probe.remove();

  return computedColor || "#7C9E87";
};

const updateThemeColorMeta = (): void => {
  const metaThemeColor = ensureThemeColorMeta();

  if (!metaThemeColor) {
    return;
  }

  metaThemeColor.content = resolveThemeColor();
};

const applyTheme = (theme: string): void => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.setAttribute("data-theme", theme);
  document.body.setAttribute("data-theme", theme);
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  updateThemeColorMeta();
};

const initializeTheme = (): void => {
  if (typeof document === "undefined") {
    return;
  }

  applyTheme(getStoredTheme());
};

export {
  applyTheme,
  DEFAULT_THEME,
  getStoredTheme,
  initializeTheme,
  THEME_STORAGE_KEY,
  updateThemeColorMeta,
};
