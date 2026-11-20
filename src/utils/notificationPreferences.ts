import { getToken, saveToken } from "./secureStore";

const SONIDO_KEY = "notificaciones_sonido_activo";

export async function getSonidoActivo(): Promise<boolean> {
  const stored = await getToken(SONIDO_KEY);
  return stored === null ? true : stored === "true";
}

export async function setSonidoActivo(activo: boolean): Promise<void> {
  await saveToken(SONIDO_KEY, activo ? "true" : "false");
}
