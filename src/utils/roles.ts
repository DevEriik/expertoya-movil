export type UserRole = "CLIENTE" | "PROFESIONAL" | "ADMIN";

export function normalizeRole(rol: unknown): UserRole {
  if (typeof rol === "string") {
    const upper = rol.trim().toUpperCase();
    if (upper === "CLIENTE" || upper === "PROFESIONAL" || upper === "ADMIN") {
      return upper;
    }
  }

  return "CLIENTE";
}

export function isAdmin(rol: string | null | undefined): boolean {
  return normalizeRole(rol) === "ADMIN";
}

export function isProfesional(rol: string | null | undefined): boolean {
  return normalizeRole(rol) === "PROFESIONAL";
}

export function isCliente(rol: string | null | undefined): boolean {
  return normalizeRole(rol) === "CLIENTE";
}

export function getRoleLabel(rol: string | null | undefined): string {
  switch (normalizeRole(rol)) {
    case "ADMIN":
      return "Administrador";
    case "PROFESIONAL":
      return "Profesional";
    default:
      return "Cliente";
  }
}
