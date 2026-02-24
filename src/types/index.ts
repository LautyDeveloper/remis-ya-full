export interface Chofer {
  id: number;
  nombre: string;
  auto: string;
  patente: string;
  estado: 'disponible' | 'en_viaje' | 'no_disponible';
  razonNoDisponible?: string;
  posicionCola: number;
}

export interface DireccionFavorita {
  etiqueta: string;
  direccion: string;
}

export interface Pasajero {
  id: number;
  nombre: string;
  direccionPrincipal: string;
  telefono: string;
  metodoPagoPreferido: 'Efectivo' | 'Transferencia' | 'Tarjeta';
  direccionesFavoritas: DireccionFavorita[];
  notas: string;
}

export interface Telefonista {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface Viaje {
  id: number;
  origen: string;
  destino: string;
  pasajeroId: number | null;
  pasajeroNombre: string;
  choferId: number;
  choferNombre: string;
  telefonistaId: number;
  telefonistaNombre: string;
  monto: number;
  metodoPago: 'Efectivo' | 'Transferencia' | 'Tarjeta';
  estado: 'pendiente' | 'en_curso' | 'completado' | 'cancelado';
  fechaHora: string;
  notas: string;
}

export interface Reserva {
  id: number;
  fechaHora: string;
  origen: string;
  destino: string;
  pasajeroId: number | null;
  pasajeroNombre: string;
  choferId: number | null;
  choferNombre: string;
  montoEstimado: number;
  metodoPago: 'Efectivo' | 'Transferencia' | 'Tarjeta';
  estado: 'programada' | 'confirmada' | 'completada' | 'cancelada';
  notas: string;
}

export type MetodoPago = 'Efectivo' | 'Transferencia' | 'Tarjeta';
export type EstadoChofer = 'disponible' | 'en_viaje' | 'no_disponible';
export type EstadoViaje = 'pendiente' | 'en_curso' | 'completado' | 'cancelado';
export type EstadoReserva = 'programada' | 'confirmada' | 'completada' | 'cancelada';

export type CategoriaGasto =
  | 'Sueldo Telefonista'
  | 'Agua'
  | 'Teléfono/Internet'
  | 'Repuestos/Arreglos'
  | 'Combustible'
  | 'Impuestos'
  | 'Alquiler'
  | 'Otros';

export interface Gasto {
  id: number;
  categoria: CategoriaGasto;
  monto: number;
  descripcion: string;
  fecha: string; // ISO format
  telefonistaId: number;
  telefonistaNombre: string;
}
