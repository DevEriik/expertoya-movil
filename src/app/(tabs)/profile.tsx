import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/theme";

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const router = useRouter();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + 20, backgroundColor: isDark ? '#121212' : '#FAFAFA' }]} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#1A237E' }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#A0AAB2' : '#7986CB' }]}>Manage your account and preferences.</Text>
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>

        {/* Account Details */}
        <TouchableOpacity style={styles.listItem} onPress={() => router.push('/account-details')}>
          <View style={[styles.iconContainer, { backgroundColor: isDark ? '#003366' : '#E8F0FE' }]}>
            <Ionicons name="person-outline" size={24} color={isDark ? '#66B2FF' : '#1A73E8'} />
          </View>
          <View style={styles.itemTextContainer}>
            <Text style={[styles.itemTitle, { color: isDark ? '#FFFFFF' : '#1A237E' }]}>Account Details</Text>
            <Text style={[styles.itemSubtitle, { color: isDark ? '#8A92A6' : '#8A92A6' }]}>Edit profile, Identity Validation status</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDark ? '#555' : '#C4C4C4'} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />

        {/* Payment Methods */}
        <TouchableOpacity style={styles.listItem}>
          <View style={[styles.iconContainer, { backgroundColor: isDark ? '#003311' : '#E6F4EA' }]}>
            <Ionicons name="card-outline" size={24} color={isDark ? '#4CAF50' : '#1E8E3E'} />
          </View>
          <View style={styles.itemTextContainer}>
            <Text style={[styles.itemTitle, { color: isDark ? '#FFFFFF' : '#1A237E' }]}>Payment Methods</Text>
            <Text style={[styles.itemSubtitle, { color: isDark ? '#8A92A6' : '#8A92A6' }]}>Mercado Pago, Escrow Wallet settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDark ? '#555' : '#C4C4C4'} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />

        {/* Notifications */}
        <TouchableOpacity style={styles.listItem}>
          <View style={[styles.iconContainer, { backgroundColor: isDark ? '#4D3300' : '#FEF3E0' }]}>
            <Ionicons name="notifications-outline" size={24} color={isDark ? '#FFB74D' : '#F29900'} />
          </View>
          <View style={styles.itemTextContainer}>
            <Text style={[styles.itemTitle, { color: isDark ? '#FFFFFF' : '#1A237E' }]}>Notifications</Text>
            <Text style={[styles.itemSubtitle, { color: isDark ? '#8A92A6' : '#8A92A6' }]}>Manage alerts and job updates</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDark ? '#555' : '#C4C4C4'} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />

        {/* Privacy & Security */}
        <TouchableOpacity style={styles.listItem}>
          <View style={[styles.iconContainer, { backgroundColor: isDark ? '#003366' : '#E8F0FE' }]}>
            <Ionicons name="shield-checkmark-outline" size={24} color={isDark ? '#66B2FF' : '#1A73E8'} />
          </View>
          <View style={styles.itemTextContainer}>
            <Text style={[styles.itemTitle, { color: isDark ? '#FFFFFF' : '#1A237E' }]}>Privacy & Security</Text>
            <Text style={[styles.itemSubtitle, { color: isDark ? '#8A92A6' : '#8A92A6' }]}>Password, 2FA, data options</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDark ? '#555' : '#C4C4C4'} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />

        {/* Accessibility Hub */}
        <TouchableOpacity style={[styles.listItem, { backgroundColor: isDark ? '#3A2300' : '#FFF8F0' }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#FF8A00' }]}>
            <Ionicons name="options-outline" size={24} color="#FFF" />
          </View>
          <View style={styles.itemTextContainer}>
            <Text style={[styles.itemTitle, { color: '#FF8A00' }]}>Accessibility Hub</Text>
            <Text style={[styles.itemSubtitle, { color: isDark ? '#A0AAB2' : '#8A92A6' }]}>Text size, contrast, dictation options</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FF8A00" />
        </TouchableOpacity>

      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={[styles.versionText, { color: isDark ? '#555' : '#C4C4C4' }]}>EXPERTOYA! VERSION 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  card: {
    borderRadius: 24,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
    marginBottom: 32,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginLeft: 80,
  },
  logoutButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
