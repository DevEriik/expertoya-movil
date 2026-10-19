/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    // TUS COLORES ACTUALES (¡No se tocan!)
    text: "#283593", // Dark Indigo
    background: "#FDFCF4", // Cream
    primary: "#FF8C00", // Orange CTA
    secondary: "#00BFA5", // Teal
    backgroundElement: "#FFFFFF", // Blanco para tarjetas o el Tab Bar
    backgroundSelected: "#E0E1E6",
    textSecondary: "#60646C", // Gris para textos menos importantes
    border: "#E0E1E6",

    // NUEVOS COLORES SEMÁNTICOS (Para los íconos de ajustes y notificaciones)
    info: "#1A73E8",
    infoBg: "#E8F0FE",
    success: "#10B981",
    successBg: "#E6F4EA",
    warning: "#F59E0B",
    warningBg: "#FEF3E0",
    danger: "#EF4444",
    grayIcon: "#8A92A6",
    grayBg: "#F1F5F9",
  },
  dark: {
    text: "#FDFCF4",
    background: "#121826", // Fondo Base
    primary: "#FFB74D", // Naranja Suave
    secondary: "#33EFA5", // Teal Brillante
    backgroundElement: "#1F2937", // Superficies
    backgroundSelected: "#2E3135",
    textSecondary: "#94A3B8",
    border: "#2E3135",

    // COLORES SEMÁNTICOS
    info: "#66B2FF",
    infoBg: "#003366",
    success: "#34D399",
    successBg: "#064E3B",
    warning: "#FBBF24",
    warningBg: "#451A03",
    danger: "#F87171",
    grayIcon: "#A0AAB2",
    grayBg: "#2A2A2A",
  },
  highContrastLight: {
    text: "#000000",
    background: "#FFFFFF",
    primary: "#B44000",
    secondary: "#005548",
    backgroundElement: "#FFFFFF",
    backgroundSelected: "#D8D8D8",
    textSecondary: "#111827",
    border: "#000000",

    info: "#0A3B8C",
    infoBg: "#CBE2FF",
    success: "#04523B",
    successBg: "#A7F3D0",
    warning: "#7C2D12",
    warningBg: "#FDE68A",
    danger: "#991B1B",
    grayIcon: "#111827",
    grayBg: "#E5E7EB",
  },
  highContrastDark: {
    text: "#FFFFFF",
    background: "#000000",
    primary: "#FFA000",
    secondary: "#00FFCC",
    backgroundElement: "#0A0A0A",
    backgroundSelected: "#333333",
    textSecondary: "#F3F4F6",
    border: "#FFFFFF",

    info: "#80D8FF",
    infoBg: "#002171",
    success: "#6EE7B7",
    successBg: "#064E3B",
    warning: "#FCD34D",
    warningBg: "#78350F",
    danger: "#FCA5A5",
    grayIcon: "#FFFFFF",
    grayBg: "#262626",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export interface AppThemePalette {
  readonly text: string;
  readonly background: string;
  readonly primary: string;
  readonly secondary: string;
  readonly backgroundElement: string;
  readonly backgroundSelected: string;
  readonly textSecondary: string;
  readonly border: string;
  readonly info: string;
  readonly infoBg: string;
  readonly success: string;
  readonly successBg: string;
  readonly warning: string;
  readonly warningBg: string;
  readonly danger: string;
  readonly grayIcon: string;
  readonly grayBg: string;
}

export function getThemeColors(
  isDark: boolean,
  highContrast: boolean = false
): AppThemePalette {
  if (highContrast) {
    return isDark ? Colors.highContrastDark : Colors.highContrastLight;
  }
  return isDark ? Colors.dark : Colors.light;
}

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
