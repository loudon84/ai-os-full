import "server-only";

const dictionaries = {
  en: () => import("./dictionaries/en.json").then((module) => module.default),
  zh: () => import("./dictionaries/zh.json").then((module) => module.default),
};

export type SupportedLocale = keyof typeof dictionaries;

function normalizeLocale(locale: unknown): SupportedLocale {
  if (locale === "en" || locale === "zh") return locale;
  // 兼容 zh-CN / zh-Hans / en-US 之类
  if (typeof locale === "string") {
    const lower = locale.toLowerCase();
    if (lower.startsWith("zh")) return "zh";
    if (lower.startsWith("en")) return "en";
  }
  return "zh";
}

export const getDictionary = async (locale: unknown) => {
  const key = normalizeLocale(locale);
  return dictionaries[key]();
};