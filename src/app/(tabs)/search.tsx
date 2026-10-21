import ProfilePreviewModal from "@/components/ProfilePreviewModal";
import { useTheme } from "@/hooks/use-theme";
import { useLocation } from "@/hooks/useLocation";
import { ServicioPublicadoItem } from "@/types/service";
import { apiClient } from "@/utils/api";
import { COVERAGE_MESSAGE, isInCoverageZone } from "@/utils/geoZone";
import { getPublicServicesByProfessionalId } from "@/utils/servicesStorage";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Profesion {
  _id: string;
  nombre: string;
  descripcion?: string;
}

interface Profesional {
  _id: string;
  usuario: {
    _id: string;
    nombre: string;
    apellido: string;
    fotoPerfil?: string;
    calificacionPromedio?: number;
    ubicacion?: { direccion?: string };
  };
  profesiones: Profesion[];
  descripcion?: string;
  tarifaBase?: number;
  distanciaKm?: number;
}

const RADIOS_KM = [5, 10, 20] as const;
const RADIO_POR_DEFECTO = 10;

export default function BusquedaScreen() {
  const colors = useTheme();
  const {
    coords,
    permission,
    loading: locationLoading,
    getCurrentLocation,
  } = useLocation();

  const [useGPS, setUseGPS] = useState(true);
  const [manualAddress, setManualAddress] = useState("");
  const [outOfZone, setOutOfZone] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [profesiones, setProfesiones] = useState<Profesion[]>([]);
  const [selectedProfesion, setSelectedProfesion] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [sortByPriceAsc, setSortByPriceAsc] = useState(false);
  const [radioKm, setRadioKm] = useState<number>(RADIO_POR_DEFECTO);

  // Estado para visualización del perfil del profesional por parte del cliente
  const [selectedPro, setSelectedPro] = useState<Profesional | null>(null);
  const [selectedProServices, setSelectedProServices] = useState<
    ServicioPublicadoItem[]
  >([]);
  const [showProModal, setShowProModal] = useState(false);

  const handleSelectProfesional = async (pro: Profesional) => {
    setSelectedPro(pro);
    setShowProModal(true);
    const srvs = await getPublicServicesByProfessionalId(pro._id);
    setSelectedProServices(srvs);
  };

  useEffect(() => {
    if (useGPS && coords) {
      const inside = isInCoverageZone({ lat: coords.lat, lng: coords.lng });
      setOutOfZone(!inside);
    } else {
      setOutOfZone(false);
    }
  }, [coords, useGPS]);

  const handleUseGPS = async () => {
    setUseGPS(true);
    const current = await getCurrentLocation();
    if (!current) {
      setUseGPS(false);
    }
  };

  useEffect(() => {
    const fetchProfesiones = async () => {
      try {
        const response = await apiClient("/api/profesiones");
        if (response.ok) {
          const data = await response.json();
          const result = data?.data ?? data;
          setProfesiones(Array.isArray(result) ? result : []);
        }
      } catch (error) {
        console.error("Error al cargar profesiones:", error);
        setProfesiones([]);
      }
    };
    fetchProfesiones();
  }, []);

  const handleUseManualAddress = () => {
    setUseGPS(false);
    setOutOfZone(false);
  };

  const buscarProfesionales = async () => {
    let searchCoords = coords;

    if (useGPS && !searchCoords) {
      setLoading(true);
      searchCoords = await getCurrentLocation();
      if (!searchCoords) {
        setLoading(false);
        setUseGPS(false);
        Alert.alert(
          "Ubicación necesaria",
          "No pudimos obtener tu ubicación. Activá el GPS o usá dirección manual.",
        );
        return;
      }
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append("nombre", searchTerm.trim());
      if (useGPS && searchCoords) {
        params.append("lat", String(searchCoords.lat));
        params.append("lng", String(searchCoords.lng));
      }
      if (!useGPS && manualAddress.trim()) {
        params.append("direccion", manualAddress.trim());
      }

      if (selectedProfesion) params.append("profesion", selectedProfesion);
      if (precioMin.trim()) params.append("precioMin", precioMin.trim());
      if (precioMax.trim()) params.append("precioMax", precioMax.trim());
      if (sortByPriceAsc) params.append("sort", "precio_asc");

      const response = await apiClient(
        `/api/profesionales/buscar?${params.toString()}`,
      );

      if (response.ok) {
        const data = await response.json();
        const result = data?.data ?? data;
        setProfesionales(Array.isArray(result) ? result : []);
        setOutOfZone(Boolean(data?.fueraDeCobertura));
      } else {
        setProfesionales([]);
      }
    } catch (error) {
      console.error("Error al buscar profesionales:", error);
      Alert.alert("Error", "No se pudieron cargar los profesionales");
      setProfesionales([]);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  const profesionalesVisibles = useMemo(() => {
    if (!useGPS || !coords) return profesionales;

    return profesionales.filter((p) => (p.distanciaKm ?? Infinity) <= radioKm);
  }, [profesionales, radioKm, useGPS, coords]);

  const siguienteRadio = RADIOS_KM.find((r) => r > radioKm);
  const sinResultadosEnRadio =
    profesionales.length > 0 && profesionalesVisibles.length === 0;

  const renderProfesional = ({ item }: { item: Profesional }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handleSelectProfesional(item)}
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundElement,
          borderColor: colors.backgroundSelected,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Image
          source={{
            uri:
              item.usuario.fotoPerfil &&
              !(
                Platform.OS === "web" &&
                item.usuario.fotoPerfil.startsWith("file://")
              )
                ? item.usuario.fotoPerfil
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    `${item.usuario.nombre} ${item.usuario.apellido}`,
                  )}`,
          }}
          style={styles.avatar}
        />
        <View style={styles.cardInfo}>
          <Text style={[styles.name, { color: colors.text }]}>
            {item.usuario.nombre} {item.usuario.apellido}
          </Text>
          <Text style={[styles.profesion, { color: colors.primary }]}>
            {item.profesiones.map((p) => p.nombre).join(", ")}
          </Text>
          <View style={styles.metaRow}>
            {item.usuario.calificacionPromedio !== undefined && (
              <View style={styles.rating}>
                <Ionicons name="star" size={14} color="#FBBF24" />
                <Text
                  style={[styles.metaText, { color: colors.textSecondary }]}
                >
                  {item.usuario.calificacionPromedio.toFixed(1)}
                </Text>
              </View>
            )}
            {item.distanciaKm !== undefined && (
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                • {item.distanciaKm.toFixed(1)} km
              </Text>
            )}
          </View>
        </View>
      </View>
      {item.tarifaBase !== undefined && (
        <Text style={[styles.tarifa, { color: colors.text }]}>
          ${item.tarifaBase}/hora
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={profesionalesVisibles}
          renderItem={renderProfesional}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.headerSection}>
              <Text style={[styles.title, { color: colors.text }]}>
                Buscar Profesionales
              </Text>

              <View
                style={[
                  styles.locationCard,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.backgroundSelected,
                  },
                ]}
              >
                <View style={styles.locationHeader}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={[styles.locationTitle, { color: colors.text }]}>
                    Ubicación para búsqueda
                  </Text>
                </View>

                <View style={styles.locationButtons}>
                  <TouchableOpacity
                    style={[
                      styles.locationButton,
                      {
                        backgroundColor: useGPS
                          ? colors.primary
                          : colors.background,
                        borderColor: colors.backgroundSelected,
                      },
                    ]}
                    onPress={handleUseGPS}
                    disabled={locationLoading}
                  >
                    <Ionicons
                      name="navigate-outline"
                      size={16}
                      color={useGPS ? "#FFFFFF" : colors.text}
                    />
                    <Text
                      style={[
                        styles.locationButtonText,
                        { color: useGPS ? "#FFFFFF" : colors.text },
                      ]}
                    >
                      Usar GPS
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.locationButton,
                      {
                        backgroundColor: !useGPS
                          ? colors.primary
                          : colors.background,
                        borderColor: colors.backgroundSelected,
                      },
                    ]}
                    onPress={handleUseManualAddress}
                  >
                    <Ionicons
                      name="create-outline"
                      size={16}
                      color={!useGPS ? "#FFFFFF" : colors.text}
                    />
                    <Text
                      style={[
                        styles.locationButtonText,
                        { color: !useGPS ? "#FFFFFF" : colors.text },
                      ]}
                    >
                      Dirección manual
                    </Text>
                  </TouchableOpacity>
                </View>

                {useGPS && (
                  <View style={styles.locationStatus}>
                    {locationLoading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : coords ? (
                      <Text
                        style={[
                          styles.locationStatusText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Ubicación actual: {coords.lat.toFixed(4)},{" "}
                        {coords.lng.toFixed(4)}
                      </Text>
                    ) : permission === "denied" ? (
                      <Text
                        style={[
                          styles.locationStatusText,
                          { color: colors.warning },
                        ]}
                      >
                        Permiso de ubicación denegado. Podés usar dirección
                        manual.
                      </Text>
                    ) : (
                      <Text
                        style={[
                          styles.locationStatusText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Presioná "Usar GPS" para obtener tu ubicación actual
                      </Text>
                    )}
                  </View>
                )}

                {useGPS && coords && (
                  <View style={styles.radiusSection}>
                    <Text style={[styles.filterLabel, { color: colors.text }]}>
                      Distancia máxima
                    </Text>
                    <View style={styles.chipsRow}>
                      {RADIOS_KM.map((km) => {
                        const activo = km === radioKm;
                        return (
                          <TouchableOpacity
                            key={km}
                            onPress={() => setRadioKm(km)}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: activo }}
                            accessibilityLabel={`Radio de ${km} kilómetros`}
                            style={[
                              styles.chip,
                              {
                                backgroundColor: activo
                                  ? colors.primary
                                  : colors.background,
                                borderColor: colors.backgroundSelected,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                {
                                  color: activo ? "#FFFFFF" : colors.text,
                                },
                              ]}
                            >
                              {km} km
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {!useGPS && (
                  <TextInput
                    style={[
                      styles.manualInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.backgroundSelected,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Ingresá tu dirección (calle, número, ciudad)"
                    placeholderTextColor={colors.textSecondary}
                    value={manualAddress}
                    onChangeText={setManualAddress}
                  />
                )}
                {!useGPS && (
                  <Text
                    style={[
                      styles.locationStatusText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    El filtro por distancia se aplica solo con GPS.
                  </Text>
                )}

                {outOfZone && (
                  <View
                    style={[
                      styles.warningBanner,
                      {
                        backgroundColor: colors.warningBg,
                        borderColor: colors.warning,
                      },
                    ]}
                  >
                    <Ionicons
                      name="warning-outline"
                      size={18}
                      color={colors.warning}
                    />
                    <Text
                      style={[styles.warningText, { color: colors.warning }]}
                    >
                      {COVERAGE_MESSAGE}
                    </Text>
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.searchRow,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.backgroundSelected,
                  },
                ]}
              >
                <Ionicons
                  name="search-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Buscar por nombre..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  onSubmitEditing={buscarProfesionales}
                  returnKeyType="search"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.searchButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={buscarProfesionales}
              >
                <Text style={styles.searchButtonText}>Buscar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterToggle,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.backgroundSelected,
                  },
                ]}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Ionicons
                  name="options-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={[styles.filterToggleText, { color: colors.primary }]}
                >
                  Filtros
                  {(selectedProfesion ||
                    precioMin ||
                    precioMax ||
                    sortByPriceAsc) &&
                    " •"}
                </Text>
                <Ionicons
                  name={
                    showFilters ? "chevron-up-outline" : "chevron-down-outline"
                  }
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>

              {showFilters && (
                <View
                  style={[
                    styles.filtersPanel,
                    {
                      backgroundColor: colors.backgroundElement,
                      borderColor: colors.backgroundSelected,
                    },
                  ]}
                >
                  <Text style={[styles.filterLabel, { color: colors.text }]}>
                    Oficio
                  </Text>
                  <View style={styles.chipsRow}>
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        {
                          backgroundColor:
                            selectedProfesion === ""
                              ? colors.primary
                              : colors.background,
                          borderColor: colors.backgroundSelected,
                        },
                      ]}
                      onPress={() => setSelectedProfesion("")}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color:
                              selectedProfesion === ""
                                ? "#FFFFFF"
                                : colors.text,
                          },
                        ]}
                      >
                        Todos
                      </Text>
                    </TouchableOpacity>
                    {profesiones.map((profesion) => (
                      <TouchableOpacity
                        key={profesion._id}
                        style={[
                          styles.chip,
                          {
                            backgroundColor:
                              selectedProfesion === profesion._id
                                ? colors.primary
                                : colors.background,
                            borderColor: colors.backgroundSelected,
                          },
                        ]}
                        onPress={() => setSelectedProfesion(profesion._id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color:
                                selectedProfesion === profesion._id
                                  ? "#FFFFFF"
                                  : colors.text,
                            },
                          ]}
                        >
                          {profesion.nombre}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.filterLabel, { color: colors.text }]}>
                    Precio por hora
                  </Text>
                  <View style={styles.priceRow}>
                    <TextInput
                      style={[
                        styles.priceInput,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.backgroundSelected,
                          color: colors.text,
                        },
                      ]}
                      placeholder="Mín"
                      placeholderTextColor={colors.textSecondary}
                      value={precioMin}
                      onChangeText={setPrecioMin}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[
                        styles.priceInput,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.backgroundSelected,
                          color: colors.text,
                        },
                      ]}
                      placeholder="Máx"
                      placeholderTextColor={colors.textSecondary}
                      value={precioMax}
                      onChangeText={setPrecioMax}
                      keyboardType="numeric"
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.sortRow,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.backgroundSelected,
                      },
                    ]}
                    onPress={() => setSortByPriceAsc((prev) => !prev)}
                  >
                    <Ionicons
                      name={sortByPriceAsc ? "checkbox" : "square-outline"}
                      size={22}
                      color={colors.primary}
                    />
                    <Text style={[styles.sortText, { color: colors.text }]}>
                      Ordenar por menor precio
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.applyButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => {
                      setShowFilters(false);
                      buscarProfesionales();
                    }}
                  >
                    <Text style={styles.searchButtonText}>Aplicar filtros</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            hasSearched ? (
              outOfZone ? (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="warning-outline"
                    size={48}
                    color={colors.warning}
                  />
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    Tu ubicación está fuera de la zona de cobertura.
                  </Text>
                </View>
              ) : sinResultadosEnRadio ? (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="navigate-outline"
                    size={48}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    No hay profesionales a menos de {radioKm} km.
                  </Text>
                  {siguienteRadio ? (
                    <TouchableOpacity
                      onPress={() => setRadioKm(siguienteRadio)}
                      style={[
                        styles.emptyAction,
                        { borderColor: colors.primary },
                      ]}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.emptyActionText,
                          { color: colors.primary },
                        ]}
                      >
                        Ampliar a {siguienteRadio} km
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text
                      style={[
                        styles.emptyText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Probá quitando filtros de oficio o precio.
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="search-outline"
                    size={48}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    No se encontraron profesionales
                  </Text>
                </View>
              )
            ) : (
              <View style={styles.emptyContainer}>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  Configurá tu ubicación y presioná Buscar
                </Text>
              </View>
            )
          }
        />
      )}

      {selectedPro && (
        <ProfilePreviewModal
          visible={showProModal}
          onClose={() => setShowProModal(false)}
          nombre={selectedPro.usuario.nombre}
          apellido={selectedPro.usuario.apellido}
          fotoPerfil={selectedPro.usuario.fotoPerfil}
          zonasCobertura={selectedPro.usuario.ubicacion?.direccion}
          oficiosNombres={selectedPro.profesiones.map((p) => p.nombre)}
          calificacion={selectedPro.usuario.calificacionPromedio}
          servicios={selectedProServices}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16 },
  headerSection: { gap: 12, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700" },
  locationCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  locationHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  locationTitle: { fontSize: 16, fontWeight: "600" },
  locationButtons: { flexDirection: "row", gap: 8 },
  locationButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  locationButtonText: { fontSize: 14, fontWeight: "600" },
  locationStatus: { paddingVertical: 4 },
  locationStatusText: { fontSize: 13 },
  radiusSection: { gap: 8 },
  manualInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
  },
  warningBanner: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  warningText: { fontSize: 13, lineHeight: 18, flex: 1 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 16 },
  searchButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  searchButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: "row", gap: 12, marginBottom: 8 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  cardInfo: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: "600" },
  profesion: { fontSize: 14, fontWeight: "500" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rating: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12 },
  tarifa: { fontSize: 14, fontWeight: "600" },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyAction: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: { fontSize: 15, textAlign: "center" },
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterToggleText: { fontSize: 16, fontWeight: "600" },
  filtersPanel: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  filterLabel: { fontSize: 14, fontWeight: "600" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: "500" },
  priceRow: { flexDirection: "row", gap: 12 },
  priceInput: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  sortText: { fontSize: 14 },
  applyButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
});
