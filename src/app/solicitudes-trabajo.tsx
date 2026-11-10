import { useAccessibility } from "@/context/AccessibilityContext";
import { type Solicitud, useSolicitudes } from "@/hooks/useSolicitudes";
import { useSolicitudesRealtime } from "@/hooks/useSolicitudesRealtime";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = keyof typeof Ionicons.glyphMap;


const paleta = (isDark: boolean) => ({
  fondo: isDark ? "#121826" : "#FDFCF4",
  superficie: isDark ? "#1F2937" : "#FFFFFF",
  borde: isDark ? "#2A3649" : "#E2E8F0",
  titulo: isDark ? "#FDFCF4" : "#283593",
  texto: isDark ? "#E2E8F0" : "#283593",
  suave: isDark ? "#94A3B8" : "#475569",
  naranja: isDark ? "#FFB74D" : "#FF8C00",
  exito: isDark ? "#34D399" : "#10B981",
  aviso: isDark ? "#FBBF24" : "#F59E0B",
  peligro: isDark ? "#F87171" : "#EF4444",
  sobreColor: isDark ? "#121826" : "#FFFFFF",
  fondoInput: isDark ? "#121826" : "#F8FAFC",
});

const formatearFecha = (iso: string) => {
  const texto = new Date(iso).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC", // la fecha se guarda a mediodía UTC
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const formatearFranja = (franja: string) => `${franja.replace("-", " a ")} hs`;

const horasRestantes = (iso: string) =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / 3600000);

const estaPendiente = (s: Solicitud) =>
  s.estado === "PENDIENTE" && horasRestantes(s.expira_at) > 0;

const iniciales = (nombre: string, apellido: string) =>
  `${nombre?.[0] ?? ""}${apellido?.[0] ?? ""}`.toUpperCase();


interface CardProps {
  solicitud: Solicitud;
  isDark: boolean;
  expandida: boolean;
  procesando: boolean;
  confirmando: boolean;
  abriendoChat: boolean;
  onToggle: () => void;
  onAceptar: () => void;
  onPedirRechazo: () => void;
  onCancelarRechazo: () => void;
  onConfirmarRechazo: () => void;
  onChatear: () => void;
}

function Detalle({
  icono,
  titulo,
  valor,
  isDark,
}: {
  icono: IconName;
  titulo: string;
  valor: string;
  isDark: boolean;
}) {
  const c = paleta(isDark);
  return (
    <View style={styles.detalleFila}>
      <Ionicons name={icono} size={18} color={c.naranja} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.detalleTitulo, { color: c.suave }]}>{titulo}</Text>
        <Text style={[styles.detalleValor, { color: c.texto }]}>{valor}</Text>
      </View>
    </View>
  );
}

function SolicitudCard({
  solicitud: s,
  isDark,
  expandida,
  procesando,
  confirmando,
  abriendoChat,
  onToggle,
  onAceptar,
  onPedirRechazo,
  onCancelarRechazo,
  onConfirmarRechazo,
  onChatear,
}: CardProps) {
  const router = useRouter();
  const c = paleta(isDark);
  const pendiente = estaPendiente(s);
  const nombreCliente = `${s.cliente.nombre} ${s.cliente.apellido}`.trim();

  const estado =
    s.estado === "PENDIENTE" && !pendiente ? "CANCELADO_AUTO" : s.estado;

  const metaEstado: Record<
    string,
    { texto: string; icono: IconName; color: string }
  > = {
    PENDIENTE: { texto: "Pendiente", icono: "time-outline", color: c.aviso },
    ACEPTADO: { texto: "Aceptada", icono: "checkmark-circle", color: c.exito },
    RECHAZADO: { texto: "Rechazada", icono: "close-circle", color: c.peligro },
    CANCELADO: {
      texto: "Cancelada por el cliente",
      icono: "ban-outline",
      color: c.suave,
    },
    CANCELADO_AUTO: {
      texto: "Vencida sin respuesta",
      icono: "hourglass-outline",
      color: c.suave,
    },
  };
  const meta = metaEstado[estado] ?? {
    texto: estado,
    icono: "ellipse-outline" as IconName,
    color: c.suave,
  };

  const horas = horasRestantes(s.expira_at);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: c.superficie,
          borderColor: expandida ? c.naranja : c.borde,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.cardCabecera}
        onPress={onToggle}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ expanded: expandida }}
        accessibilityLabel={`Solicitud de ${nombreCliente}, ${s.servicio.titulo_servicio}`}
      >
        {s.cliente.foto_perfil ? (
          <Image
            source={{ uri: s.cliente.foto_perfil }}
            style={styles.avatar}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarIniciales,
              { backgroundColor: c.naranja },
            ]}
          >
            <Text style={[styles.inicialesTexto, { color: c.sobreColor }]}>
              {iniciales(s.cliente.nombre, s.cliente.apellido)}
            </Text>
          </View>
        )}

        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={[styles.clienteNombre, { color: c.titulo }]}
            numberOfLines={1}
          >
            {nombreCliente}
          </Text>
          <Text
            style={[styles.servicioTitulo, { color: c.texto }]}
            numberOfLines={1}
          >
            {s.servicio.titulo_servicio}
          </Text>
          <Text style={[styles.cuandoTexto, { color: c.suave }]}>
            {formatearFecha(s.fecha_tentativa)} ·{" "}
            {formatearFranja(s.franja_horaria)}
          </Text>
        </View>

        <Ionicons
          name={expandida ? "chevron-up" : "chevron-down"}
          size={20}
          color={c.suave}
        />
      </TouchableOpacity>

      <View style={styles.estadoFila}>
        <View
          style={[
            styles.estadoInsignia,
            { borderColor: meta.color, backgroundColor: `${meta.color}22` },
          ]}
        >
          <Ionicons name={meta.icono} size={14} color={meta.color} />
          <Text style={[styles.estadoTexto, { color: c.texto }]}>
            {meta.texto}
          </Text>
        </View>
        {pendiente && (
          <View style={styles.venceFila}>
            <Ionicons name="hourglass-outline" size={14} color={c.aviso} />
            <Text style={[styles.venceTexto, { color: c.texto }]}>
              {horas <= 1 ? "Vence en menos de 1 h" : `Vence en ${horas} h`}
            </Text>
          </View>
        )}
      </View>

      {expandida && (
        <View style={[styles.detalle, { borderTopColor: c.borde }]}>
          <Detalle
            icono="person-outline"
            titulo="Cliente"
            valor={nombreCliente}
            isDark={isDark}
          />
          <Detalle
            icono="hammer-outline"
            titulo="Servicio solicitado"
            valor={`${s.servicio.titulo_servicio} · ${s.servicio.oficio.nombre_oficio}`}
            isDark={isDark}
          />
          <Detalle
            icono="calendar-outline"
            titulo="Fecha tentativa"
            valor={formatearFecha(s.fecha_tentativa)}
            isDark={isDark}
          />
          <Detalle
            icono="time-outline"
            titulo="Horario preferido"
            valor={formatearFranja(s.franja_horaria)}
            isDark={isDark}
          />

          <View style={styles.detalleFila}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={18}
              color={c.naranja}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detalleTitulo, { color: c.suave }]}>
                Descripción del trabajo
              </Text>
              <View
                style={[
                  styles.descripcionCaja,
                  { backgroundColor: c.fondo, borderColor: c.borde },
                ]}
              >
                <Text style={[styles.descripcionTexto, { color: c.texto }]}>
                  {s.descripcion}
                </Text>
              </View>
            </View>
          </View>

          {pendiente && !confirmando && (
            <View style={styles.accionesFila}>
              <TouchableOpacity
                style={[styles.botonSolido, { backgroundColor: c.peligro }]}
                onPress={onPedirRechazo}
                disabled={procesando}
                accessibilityRole="button"
                accessibilityLabel="Rechazar solicitud"
              >
                <Ionicons name="close" size={20} color={c.sobreColor} />
                <Text style={[styles.botonTexto, { color: c.sobreColor }]}>
                  Rechazar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.botonSolido, { backgroundColor: c.exito }]}
                onPress={onAceptar}
                disabled={procesando}
                accessibilityRole="button"
                accessibilityLabel="Aceptar solicitud"
              >
                {procesando ? (
                  <ActivityIndicator color={c.sobreColor} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color={c.sobreColor} />
                    <Text style={[styles.botonTexto, { color: c.sobreColor }]}>
                      Aceptar
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {pendiente && confirmando && (
            <View style={{ gap: 10 }}>
              <Text style={[styles.confirmarTexto, { color: c.texto }]}>
                ¿Rechazar esta solicitud? No podrás revertirlo.
              </Text>
              <View style={styles.accionesFila}>
                <TouchableOpacity
                  style={[styles.botonOutline, { borderColor: c.texto }]}
                  onPress={onCancelarRechazo}
                  disabled={procesando}
                  accessibilityRole="button"
                >
                  <Text style={[styles.botonTexto, { color: c.texto }]}>
                    Volver
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.botonSolido, { backgroundColor: c.peligro }]}
                  onPress={onConfirmarRechazo}
                  disabled={procesando}
                  accessibilityRole="button"
                >
                  {procesando ? (
                    <ActivityIndicator color={c.sobreColor} />
                  ) : (
                    <Text style={[styles.botonTexto, { color: c.sobreColor }]}>
                      Sí, rechazar
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {estado === "ACEPTADO" && (
            <View style={{ gap: 10 }}>
              <Text style={[styles.ayudaTexto, { color: c.suave }]}>
                Coordina la fecha, el horario y los detalles del trabajo con el
                cliente por el chat.
              </Text>
              <TouchableOpacity
                style={[
                  styles.botonSolido,
                  styles.botonAncho,
                  { backgroundColor: c.naranja },
                ]}
                onPress={onChatear}
                disabled={abriendoChat}
                accessibilityRole="button"
                accessibilityLabel="Chatear con el cliente"
              >
                {abriendoChat ? (
                  <ActivityIndicator color={c.sobreColor} />
                ) : (
                  <>
                    <Ionicons
                      name="chatbubble-ellipses"
                      size={20}
                      color={c.sobreColor}
                    />
                    <Text style={[styles.botonTexto, { color: c.sobreColor }]}>
                      Chatear con el cliente
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}


export default function SolicitudesTrabajoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkMode: isDark } = useAccessibility();
  const c = paleta(isDark);
  const { obtenerRecibidas, aceptarSolicitud, rechazarSolicitud, abrirChat } =
    useSolicitudes();

  const [items, setItems] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"pendientes" | "respondidas">("pendientes");
  const [expandidas, setExpandidas] = useState<string[]>([]);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [abriendoChatId, setAbriendoChatId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setItems(await obtenerRecibidas());
      setError("");
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "No se pudieron cargar las solicitudes.",
      );
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [obtenerRecibidas]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  useSolicitudesRealtime({ onCambio: cargar });

  const pendientes = useMemo(
    () =>
      items
        .filter(estaPendiente)
        .sort(
          (a, b) =>
            new Date(a.expira_at).getTime() - new Date(b.expira_at).getTime(),
        ),
    [items],
  );
  const respondidas = useMemo(
    () => items.filter((s) => !estaPendiente(s)),
    [items],
  );
  const lista = tab === "pendientes" ? pendientes : respondidas;

  const responder = async (id: string, accion: "aceptar" | "rechazar") => {
    setProcesandoId(id);
    setError("");
    try {
      const actualizada =
        accion === "aceptar"
          ? await aceptarSolicitud(id)
          : await rechazarSolicitud(id);
      setItems((prev) => prev.map((s) => (s.id === id ? actualizada : s)));
      setConfirmandoId(null);
      if (accion === "aceptar") {
        setTab("respondidas");
        setExpandidas((prev) => (prev.includes(id) ? prev : [...prev, id]));
      } else {
        setExpandidas((prev) => prev.filter((x) => x !== id));
      }
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "No se pudo actualizar la solicitud.",
      );
      cargar();
    } finally {
      setProcesandoId(null);
    }
  };

  const irAlChat = async (s: Solicitud) => {
    setAbriendoChatId(s.id);
    setError("");
    try {
      const chatId = s.chat_id ?? (await abrirChat(s.id));
      router.push({ pathname: "/(tabs)/chat", params: { chatId } });
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "No se pudo abrir el chat. Inténtalo de nuevo.",
      );
    } finally {
      setAbriendoChatId(null);
    }
  };

  const alternarExpandida = (id: string) =>
    setExpandidas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const cambiarTab = (nuevo: "pendientes" | "respondidas") => {
    setTab(nuevo);
    setConfirmandoId(null);
  };
  return (
    <View style={[styles.pantalla, { backgroundColor: c.fondo }]}>
      <View
        style={[
          styles.encabezado,
          {
            backgroundColor: c.superficie,
            borderBottomColor: c.borde,
            paddingTop: Math.max(insets.top + 8, 16),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.atras}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={24} color={c.titulo} />
        </TouchableOpacity>
        <Text style={[styles.encabezadoTitulo, { color: c.titulo }]}>
          Solicitudes de Trabajo
        </Text>
        <View style={styles.atras} />
      </View>

      <View style={styles.tabs}>
        {(
          [
            { id: "pendientes", texto: `Pendientes (${pendientes.length})` },
            { id: "respondidas", texto: "Respondidas" },
          ] as const
        ).map((t) => {
          const activa = tab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.tab,
                {
                  backgroundColor: activa ? c.naranja : "transparent",
                  borderColor: activa ? c.naranja : c.borde,
                },
              ]}
              onPress={() => cambiarTab(t.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: activa }}
            >
              <Text
                style={[
                  styles.tabTexto,
                  { color: activa ? c.sobreColor : c.texto },
                ]}
              >
                {activa ? "✓ " : ""}
                {t.texto}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!!error && (
        <View
          style={[
            styles.errorCaja,
            { borderColor: c.peligro, backgroundColor: `${c.peligro}22` },
          ]}
          accessibilityRole="alert"
        >
          <Ionicons name="alert-circle" size={20} color={c.peligro} />
          <Text style={[styles.errorTexto, { color: c.texto }]}>{error}</Text>
        </View>
      )}

      {cargando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={c.naranja} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContenido}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => {
                setRefrescando(true);
                cargar();
              }}
              tintColor={c.naranja}
            />
          }
        >
          {lista.length === 0 ? (
            <View style={styles.vacio}>
              <Ionicons name="file-tray-outline" size={56} color={c.suave} />
              <Text style={[styles.vacioTitulo, { color: c.titulo }]}>
                {tab === "pendientes"
                  ? "No tienes solicitudes pendientes"
                  : "Aún no respondiste ninguna solicitud"}
              </Text>
              <Text style={[styles.vacioTexto, { color: c.suave }]}>
                {tab === "pendientes"
                  ? "Cuando un cliente solicite uno de tus servicios, aparecerá aquí."
                  : "Las solicitudes que aceptes, rechaces o que venzan se verán aquí."}
              </Text>
            </View>
          ) : (
            lista.map((s) => (
              <SolicitudCard
                key={s.id}
                solicitud={s}
                isDark={isDark}
                expandida={expandidas.includes(s.id)}
                procesando={procesandoId === s.id}
                confirmando={confirmandoId === s.id}
                abriendoChat={abriendoChatId === s.id}
                onToggle={() => {
                  alternarExpandida(s.id);
                  if (confirmandoId === s.id) setConfirmandoId(null);
                }}
                onAceptar={() => responder(s.id, "aceptar")}
                onPedirRechazo={() => setConfirmandoId(s.id)}
                onCancelarRechazo={() => setConfirmandoId(null)}
                onConfirmarRechazo={() => responder(s.id, "rechazar")}
                onChatear={() => irAlChat(s)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  atras: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  encabezadoTitulo: { fontSize: 18, fontWeight: "700" }, 
  tabs: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  tab: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  tabTexto: { fontSize: 14, fontWeight: "700" },
  errorCaja: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorTexto: { flex: 1, fontSize: 14, fontWeight: "500" },
  centro: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContenido: { padding: 16, gap: 14, paddingBottom: 40 },
  vacio: { alignItems: "center", paddingVertical: 60, gap: 10 },
  vacioTitulo: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  vacioTexto: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  card: { borderRadius: 20, borderWidth: 1.5, overflow: "hidden" },
  cardCabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    paddingBottom: 8,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarIniciales: { alignItems: "center", justifyContent: "center" },
  inicialesTexto: { fontSize: 17, fontWeight: "800" },
  clienteNombre: { fontSize: 16, fontWeight: "700" },
  servicioTitulo: { fontSize: 14, fontWeight: "500" }, 
  cuandoTexto: { fontSize: 12.5, fontWeight: "400" },
  estadoFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  estadoInsignia: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  estadoTexto: { fontSize: 12.5, fontWeight: "700" },
  venceFila: { flexDirection: "row", alignItems: "center", gap: 4 },
  venceTexto: { fontSize: 12.5, fontWeight: "700" },
  detalle: { borderTopWidth: 1, padding: 14, gap: 14 },
  detalleFila: { flexDirection: "row", gap: 10 },
  detalleTitulo: { fontSize: 12, fontWeight: "500", marginBottom: 2 },
  detalleValor: { fontSize: 15, fontWeight: "500" },
  descripcionCaja: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  descripcionTexto: { fontSize: 14.5, lineHeight: 21, fontWeight: "400" },
  ayudaTexto: { fontSize: 13.5, lineHeight: 19, fontWeight: "400" },
  accionesFila: { flexDirection: "row", gap: 10 },
  botonSolido: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  botonAncho: { flex: 0, alignSelf: "stretch" },
  botonOutline: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  botonTexto: { fontSize: 15, fontWeight: "700" },
  confirmarTexto: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
});
