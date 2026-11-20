export interface ServicioPublicadoItem {
  id: string;
  profesional_id?: string;
  oficio_id: number;
  titulo_servicio: string;
  descripcion_servicio: string;
  costo_estimado: number;
  duracion_estimada: string;
  fotos_servicio: string[];
  servicio_activo: boolean;
  nombre_oficio?: string;
  creado_en?: string;
}

export interface OficioOption {
  id: number;
  nombre_oficio: string;
  descripcion_oficio?: string | null;
}
