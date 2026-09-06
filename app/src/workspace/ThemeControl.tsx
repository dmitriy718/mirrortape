import { useEffect, useState } from "react";
type Theme = "system" | "light" | "dark";
export default function ThemeControl() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const value = localStorage.getItem("mirrortape-theme");
      return value === "light" || value === "dark" ? value : "system";
    } catch {
      return "system";
    }
  });
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.style.colorScheme =
        document.documentElement.dataset.theme;
    };
    apply();
    try {
      localStorage.setItem("mirrortape-theme", theme);
    } catch {
      /* Theme remains available for this session when browser storage is disabled. */
    }
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  return (
    <label className="theme-control">
      <span className="sr-only">Color theme</span>
      <select
        aria-label="Color theme"
        value={theme}
        onChange={(e) => setTheme(e.target.value as Theme)}
      >
        <option value="system">◐ System</option>
        <option value="dark">☾ Dark</option>
        <option value="light">☀ Light</option>
      </select>
    </label>
  );
}
