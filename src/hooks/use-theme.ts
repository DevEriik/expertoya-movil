/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { AppThemePalette, getThemeColors } from "@/constants/theme";
import { AccessibilityContext } from "@/context/AccessibilityContext";
import { useContext } from "react";
import { useColorScheme } from "react-native";

export function useTheme(): AppThemePalette {
  const accessContext = useContext(AccessibilityContext);
  const systemScheme = useColorScheme();

  if (accessContext) {
    return accessContext.colors;
  }

  const isDark = systemScheme === "dark";
  return getThemeColors(isDark, false);
}
