import React from "react";

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const useTheme = () => ({
  theme: "light",
  setTheme: () => {},
  resolvedTheme: "light",
  themes: ["light", "dark"],
  systemTheme: "light",
});

export { ThemeProvider, useTheme };
