import { AccessibilityContext } from "@/context/AccessibilityContext";
import { useContext } from "react";
import {
  ColorSchemeName,
  useColorScheme as useRNColorScheme,
} from "react-native";

export function useColorScheme(): NonNullable<ColorSchemeName> {
  const accessContext = useContext(AccessibilityContext);
  const rnScheme = useRNColorScheme();

  if (accessContext) {
    return accessContext.isDarkMode ? "dark" : "light";
  }

  return rnScheme === "dark" ? "dark" : "light";
}
