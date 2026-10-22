import { AccessibilityContext } from "@/context/AccessibilityContext";
import { useContext, useEffect, useState } from "react";
import {
  ColorSchemeName,
  useColorScheme as useRNColorScheme,
} from "react-native";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): NonNullable<ColorSchemeName> {
  const accessContext = useContext(AccessibilityContext);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (accessContext) {
    return accessContext.isDarkMode ? "dark" : "light";
  }

  if (hasHydrated) {
    return colorScheme === "dark" ? "dark" : "light";
  }

  return "light";
}
