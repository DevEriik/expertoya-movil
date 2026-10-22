import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import { AppThemePalette, getThemeColors } from "../constants/theme";
import { getToken, saveToken } from "../utils/secureStore";

export type TextSize = "Small" | "Medium" | "Large";

export interface AccessibilitySettings {
  isDarkMode: boolean;
  highContrast: boolean;
  textSize: TextSize;
  voiceDictation: boolean;
}

export interface AccessibilityContextData {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  textSize: TextSize;
  setTextSize: (val: TextSize) => void;
  textScale: number;
  scaleFont: (size: number) => number;
  voiceDictation: boolean;
  setVoiceDictation: (val: boolean) => void;
  colors: AppThemePalette;
  isLoading: boolean;
  resetSettings: () => Promise<void>;
}

const STORAGE_KEY = "accessibility_settings";

const TEXT_SCALE_MAP: Record<TextSize, number> = {
  Small: 0.85,
  Medium: 1.0,
  Large: 1.25,
};

export const AccessibilityContext = createContext<AccessibilityContextData | null>(
  null
);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemScheme = useColorScheme();

  const [isDarkMode, setIsDarkModeState] = useState<boolean>(
    systemScheme === "dark"
  );
  const [highContrast, setHighContrastState] = useState<boolean>(false);
  const [textSize, setTextSizeState] = useState<TextSize>("Medium");
  const [voiceDictation, setVoiceDictationState] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cargar preferencias guardadas al iniciar
  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const stored = await getToken(STORAGE_KEY);
        if (stored && isMounted) {
          const parsed: Partial<AccessibilitySettings> = JSON.parse(stored);
          if (typeof parsed.isDarkMode === "boolean") {
            setIsDarkModeState(parsed.isDarkMode);
          } else {
            setIsDarkModeState(systemScheme === "dark");
          }
          if (typeof parsed.highContrast === "boolean") {
            setHighContrastState(parsed.highContrast);
          }
          if (
            parsed.textSize === "Small" ||
            parsed.textSize === "Medium" ||
            parsed.textSize === "Large"
          ) {
            setTextSizeState(parsed.textSize);
          }
          if (typeof parsed.voiceDictation === "boolean") {
            setVoiceDictationState(parsed.voiceDictation);
          }
        } else if (isMounted) {
          setIsDarkModeState(systemScheme === "dark");
        }
      } catch (error) {
        console.error("Error al cargar configuraciones de accesibilidad:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [systemScheme]);

  const persistSettings = useCallback(
    async (newSettings: AccessibilitySettings) => {
      try {
        await saveToken(STORAGE_KEY, JSON.stringify(newSettings));
      } catch (error) {
        console.error("Error al guardar accesibilidad:", error);
      }
    },
    []
  );

  const setIsDarkMode = useCallback(
    (val: boolean) => {
      setIsDarkModeState(val);
      persistSettings({
        isDarkMode: val,
        highContrast,
        textSize,
        voiceDictation,
      });
    },
    [highContrast, textSize, voiceDictation, persistSettings]
  );

  const setHighContrast = useCallback(
    (val: boolean) => {
      setHighContrastState(val);
      persistSettings({
        isDarkMode,
        highContrast: val,
        textSize,
        voiceDictation,
      });
    },
    [isDarkMode, textSize, voiceDictation, persistSettings]
  );

  const setTextSize = useCallback(
    (val: TextSize) => {
      setTextSizeState(val);
      persistSettings({
        isDarkMode,
        highContrast,
        textSize: val,
        voiceDictation,
      });
    },
    [isDarkMode, highContrast, voiceDictation, persistSettings]
  );

  const setVoiceDictation = useCallback(
    (val: boolean) => {
      setVoiceDictationState(val);
      persistSettings({
        isDarkMode,
        highContrast,
        textSize,
        voiceDictation: val,
      });
    },
    [isDarkMode, highContrast, textSize, persistSettings]
  );

  const resetSettings = useCallback(async () => {
    const defaults: AccessibilitySettings = {
      isDarkMode: systemScheme === "dark",
      highContrast: false,
      textSize: "Medium",
      voiceDictation: true,
    };
    setIsDarkModeState(defaults.isDarkMode);
    setHighContrastState(defaults.highContrast);
    setTextSizeState(defaults.textSize);
    setVoiceDictationState(defaults.voiceDictation);
    await persistSettings(defaults);
  }, [systemScheme, persistSettings]);

  const textScale = useMemo(() => TEXT_SCALE_MAP[textSize] ?? 1.0, [textSize]);

  const scaleFont = useCallback(
    (size: number) => Math.round(size * textScale),
    [textScale]
  );

  const colors = useMemo(
    () => getThemeColors(isDarkMode, highContrast),
    [isDarkMode, highContrast]
  );

  const value = useMemo(
    () => ({
      isDarkMode,
      setIsDarkMode,
      highContrast,
      setHighContrast,
      textSize,
      setTextSize,
      textScale,
      scaleFont,
      voiceDictation,
      setVoiceDictation,
      colors,
      isLoading,
      resetSettings,
    }),
    [
      isDarkMode,
      setIsDarkMode,
      highContrast,
      setHighContrast,
      textSize,
      setTextSize,
      textScale,
      scaleFont,
      voiceDictation,
      setVoiceDictation,
      colors,
      isLoading,
      resetSettings,
    ]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility debe ser utilizado dentro de un AccessibilityProvider"
    );
  }
  return context;
};
