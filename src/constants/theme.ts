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

    // NUEVOS COLORES SEMÁNTICOS (Para los íconos de ajustes y notificaciones)
    info: "#1A73E8",
    infoBg: "#E8F0FE",
    success: "#4CAF50",
    successBg: "#E6F4EA",
    warning: "#F29900",
    warningBg: "#FEF3E0",
    grayIcon: "#8A92A6",
    grayBg: "#F1F5F9",
  },
  dark: {
    // TUS COLORES ACTUALES (¡No se tocan!)
    text: "#FDFCF4", // En modo oscuro invertimos el texto a crema
    background: "#121212", // Fondo muy oscuro
    primary: "#FF8C00", // El naranja se mantiene igual de vibrante
    secondary: "#00BFA5", // El verde azulado también
    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
    textSecondary: "#B0B4BA",

    // NUEVOS COLORES SEMÁNTICOS
    info: "#66B2FF",
    infoBg: "#003366",
    success: "#4CAF50",
    successBg: "#003311",
    warning: "#FFB74D",
    warningBg: "#4D3300",
    grayIcon: "#A0AAB2",
    grayBg: "#2A2A2A",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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
