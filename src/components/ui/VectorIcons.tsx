import IoniconsBase from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIconsBase from 'react-native-vector-icons/MaterialCommunityIcons';

export const Ionicons = IoniconsBase as typeof IoniconsBase & {
  glyphMap: Record<string, number>;
};

export const MaterialCommunityIcons =
  MaterialCommunityIconsBase as typeof MaterialCommunityIconsBase & {
    glyphMap: Record<string, number>;
  };
