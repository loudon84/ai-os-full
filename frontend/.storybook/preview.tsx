import type { Preview } from "@storybook/react";

// Global styles - order matters
import "../app/assets/scss/globals.scss";
import "../app/assets/scss/theme.scss";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#EEF1F9" },
        { name: "dark", value: "hsl(222.2, 47.4%, 11.2%)" },
        { name: "white", value: "#ffffff" },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: "Mobile",
          styles: { width: "375px", height: "812px" },
        },
        tablet: {
          name: "Tablet",
          styles: { width: "768px", height: "1024px" },
        },
        desktop: {
          name: "Desktop",
          styles: { width: "1280px", height: "800px" },
        },
        widescreen: {
          name: "Widescreen",
          styles: { width: "1920px", height: "1080px" },
        },
      },
    },
  },

  globalTypes: {
    theme: {
      name: "Theme",
      description: "Color theme",
      defaultValue: "default",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "default", title: "Default (Violet)" },
          { value: "theme-zinc", title: "Zinc" },
          { value: "theme-slate", title: "Slate" },
          { value: "theme-stone", title: "Stone" },
          { value: "theme-gray", title: "Gray" },
          { value: "theme-neutral", title: "Neutral" },
          { value: "theme-red", title: "Red" },
          { value: "theme-rose", title: "Rose" },
          { value: "theme-orange", title: "Orange" },
          { value: "theme-green", title: "Green" },
          { value: "theme-blue", title: "Blue" },
          { value: "theme-yellow", title: "Yellow" },
          { value: "theme-violet", title: "Violet" },
        ],
      },
    },
    mode: {
      name: "Mode",
      description: "Light/Dark mode",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
      },
    },
  },

  decorators: [
    (Story, context) => {
      const theme = context.globals.theme;
      const mode = context.globals.mode;

      // Apply theme class
      const themeClasses: string[] = [];
      if (theme && theme !== "default") {
        themeClasses.push(theme);
      }
      if (mode === "dark") {
        themeClasses.push("dark");
      }

      const className = themeClasses.join(" ");

      return (
        <div className={className}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
