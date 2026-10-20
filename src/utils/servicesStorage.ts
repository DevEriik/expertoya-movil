import { DeviceEventEmitter } from "react-native";
import { ServicioPublicadoItem } from "@/types/service";
import { apiClient } from "./api";
import { getToken, saveToken } from "./secureStore";

const STORAGE_KEY = "expertoya_user_services";
export const MAX_ACTIVE_SERVICES = 30;

const DEFAULT_SERVICES: ServicioPublicadoItem[] = [
  {
    id: "1",
    oficio_id: 3,
    nombre_oficio: "Electricista",
    titulo_servicio: "Reparación de Tablero Eléctrico",
    descripcion_servicio:
      "Diagnóstico preventivo y correctivo, cambio de llaves térmicas y disyuntor diferencial bajo normativa IRAM. Incluye revisión de puesta a tierra y medición de cargas para evitar sobrecalentamientos.",
    costo_estimado: 45000,
    duracion_estimada: "2-3 horas",
    fotos_servicio: [
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop",
    ],
    servicio_activo: true,
  },
  {
    id: "2",
    oficio_id: 3,
    nombre_oficio: "Electricista",
    titulo_servicio: "Instalación de Tomacorrientes y Llaves de Luz",
    descripcion_servicio:
      "Instalación de bocas nuevas, llaves combinadas y tomas de alto consumo para aires acondicionados con materiales ignífugos normados.",
    costo_estimado: 15000,
    duracion_estimada: "1 hora",
    fotos_servicio: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600&auto=format&fit=crop",
    ],
    servicio_activo: true,
  },
];

let inMemoryServices: ServicioPublicadoItem[] | null = null;

export const getServices = async (): Promise<ServicioPublicadoItem[]> => {
  // 1. Intentar obtener desde el backend API
  try {
    const res = await apiClient("/api/professionals/services");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        inMemoryServices = data;
        await persistServices(data);
        return [...data];
      }
    }
  } catch {
    // Si no hay sesión o backend en desarrollo, continuar con local
  }

  // 2. Fallback a almacenamiento local / memoria
  if (inMemoryServices) {
    return [...inMemoryServices];
  }
  try {
    const raw = await getToken(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryServices = parsed;
        return [...inMemoryServices];
      }
    }
  } catch (err) {
    console.warn("Error leyendo servicios del almacenamiento local:", err);
  }

  inMemoryServices = [...DEFAULT_SERVICES];
  await persistServices(inMemoryServices);
  return [...inMemoryServices];
};

export const getPublicServicesByProfessionalId = async (
  professionalId: string,
): Promise<ServicioPublicadoItem[]> => {
  try {
    const res = await apiClient(
      `/api/professionals/public/${professionalId}/services`,
      {
        useToken: false,
      },
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (err) {
    console.warn("Error obteniendo servicios públicos del profesional:", err);
  }
  return [];
};

export const getServiceById = async (
  id: string,
): Promise<ServicioPublicadoItem | undefined> => {
  const all = await getServices();
  return all.find((s) => s.id === id);
};

export const saveService = async (
  serviceData: Omit<ServicioPublicadoItem, "id"> & { id?: string },
): Promise<ServicioPublicadoItem> => {
  const isEditing = Boolean(serviceData.id);

  // 1. Validar límite local si se intenta guardar como activo
  if (serviceData.servicio_activo) {
    const current = await getServices();
    const activeCount = current.filter(
      (s) => s.servicio_activo && (!isEditing || s.id !== serviceData.id),
    ).length;
    if (activeCount >= MAX_ACTIVE_SERVICES) {
      throw new Error(
        `Límite alcanzado: Tienes ${MAX_ACTIVE_SERVICES} servicios activos. Pausa o elimina uno para activar este servicio.`,
      );
    }
  }

  // 2. Intentar guardar en backend
  try {
    const endpoint = isEditing
      ? `/api/professionals/services/${serviceData.id}`
      : "/api/professionals/services";
    const method = isEditing ? "PUT" : "POST";

    const res = await apiClient(endpoint, {
      method,
      body: JSON.stringify(serviceData),
    });

    if (res.ok) {
      const json = await res.json();
      const saved: ServicioPublicadoItem = json.servicio || json;
      await syncLocalAfterSave(saved, isEditing);
      DeviceEventEmitter.emit("servicesChanged");
      return saved;
    } else {
      const errJson = await res.json().catch(() => null);
      if (errJson?.error) {
        throw new Error(errJson.error);
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes("Límite")) {
      throw err;
    }
    console.warn(
      "Backend no disponible para guardar servicio, usando local fallback:",
      err.message,
    );
  }

  // 3. Fallback local si backend no responde
  const current = await getServices();
  let savedItem: ServicioPublicadoItem;
  let updatedList: ServicioPublicadoItem[];

  if (isEditing) {
    savedItem = { ...serviceData, id: serviceData.id! };
    updatedList = current.map((s) => (s.id === savedItem.id ? savedItem : s));
  } else {
    savedItem = {
      ...serviceData,
      id: Date.now().toString(),
      creado_en: new Date().toISOString(),
    };
    updatedList = [savedItem, ...current];
  }

  inMemoryServices = updatedList;
  await persistServices(updatedList);
  DeviceEventEmitter.emit("servicesChanged");
  return savedItem;
};

const syncLocalAfterSave = async (
  item: ServicioPublicadoItem,
  isEditing: boolean,
) => {
  const current = inMemoryServices || (await getServices());
  let updated: ServicioPublicadoItem[];
  if (isEditing) {
    updated = current.map((s) => (s.id === item.id ? item : s));
  } else {
    updated = [item, ...current];
  }
  inMemoryServices = updated;
  await persistServices(updated);
};

export const toggleServiceStatus = async (
  id: string,
): Promise<ServicioPublicadoItem> => {
  const current = await getServices();
  const existing = current.find((s) => s.id === id);
  if (!existing) {
    throw new Error("Servicio no encontrado.");
  }

  const newStatus = !existing.servicio_activo;

  if (newStatus) {
    const activeCount = current.filter(
      (s) => s.servicio_activo && s.id !== id,
    ).length;
    if (activeCount >= MAX_ACTIVE_SERVICES) {
      throw new Error(
        `Límite alcanzado: Ya cuentas con el máximo de ${MAX_ACTIVE_SERVICES} servicios activos. Pausa otro servicio primero.`,
      );
    }
  }

  try {
    const res = await apiClient(`/api/professionals/services/${id}`, {
      method: "PUT",
      body: JSON.stringify({ servicio_activo: newStatus }),
    });
    if (res.ok) {
      const json = await res.json();
      const updated: ServicioPublicadoItem = json.servicio || {
        ...existing,
        servicio_activo: newStatus,
      };
      await syncLocalAfterSave(updated, true);
      DeviceEventEmitter.emit("servicesChanged");
      return updated;
    }
  } catch {
    // fallback
  }

  const updatedItem: ServicioPublicadoItem = {
    ...existing,
    servicio_activo: newStatus,
  };
  const updatedList = current.map((s) => (s.id === id ? updatedItem : s));
  inMemoryServices = updatedList;
  await persistServices(updatedList);
  DeviceEventEmitter.emit("servicesChanged");
  return updatedItem;
};

export const deleteService = async (id: string): Promise<void> => {
  try {
    await apiClient(`/api/professionals/services/${id}`, {
      method: "DELETE",
    });
  } catch {
    // fallback
  }

  const current = await getServices();
  const updatedList = current.filter((s) => s.id !== id);
  inMemoryServices = updatedList;
  await persistServices(updatedList);
  DeviceEventEmitter.emit("servicesChanged");
};

export const getActiveServicesCount = async (): Promise<number> => {
  const all = await getServices();
  return all.filter((s) => s.servicio_activo).length;
};

const persistServices = async (list: ServicioPublicadoItem[]) => {
  try {
    await saveToken(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Error al persistir servicios:", err);
  }
};
