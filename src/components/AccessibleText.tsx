import React from "react";
import { StyleSheet, Text as RNText, TextProps } from "react-native";
import { useAccessibility } from "@/context/AccessibilityContext";

export interface AccessibleTextProps extends TextProps {
  allowScaling?: boolean;
}

export const AccessibleText: React.FC<AccessibleTextProps> = ({
  style,
  allowScaling = true,
  children,
  ...rest
}) => {
  const { textScale } = useAccessibility();

  const flattened = StyleSheet.flatten(style) || {};
  const fontSize =
    flattened.fontSize && allowScaling
      ? Math.round(flattened.fontSize * textScale)
      : flattened.fontSize;
  const lineHeight =
    flattened.lineHeight && allowScaling
      ? Math.round(flattened.lineHeight * textScale)
      : flattened.lineHeight;

  return (
    <RNText
      {...rest}
      style={[
        style,
        fontSize !== undefined ? { fontSize } : null,
        lineHeight !== undefined ? { lineHeight } : null,
      ]}
    >
      {children}
    </RNText>
  );
};
