import { format } from "date-fns";
import { es } from "date-fns/locale";

const ARG_OFFSET = "-03:00";

/**
 * Convierte un string de fecha y hora (en horario de Argentina) a un objeto Date (UTC)
 * @param dateStr Formato "YYYY-MM-DD"
 * @param timeStr Formato "HH:mm"
 * @param openTime Opcional. Si se provee, habilita lógica de madrugada (overnight).
 */
export function parseArgentineDate(dateStr: string, timeStr: string, openTime?: string): Date {
  const combined = `${dateStr}T${timeStr}:00${ARG_OFFSET}`;
  const date = new Date(combined);
  
  if (isNaN(date.getTime())) {
    throw new Error(`Fecha o hora inválida: ${dateStr} ${timeStr}`);
  }

  // Lógica de Madrugada: Si la hora seleccionada es menor a la de apertura (ej: 00:30 < 08:00),
  // se asume que el usuario se refiere a la madrugada del día siguiente al seleccionado en el calendario,
  // ya que ese turno pertenece conceptualmente a la "noche" del día elegido.
  if (openTime) {
    const [openH] = openTime.split(":").map(Number);
    const [timeH] = timeStr.split(":").map(Number);
    if (timeH < openH) {
      date.setDate(date.getDate() + 1);
    }
  }
  
  return date;
}

/**
 * Normaliza una fecha de calendario (YYYY-MM-DD) a mediodía de Argentina 
 * para evitar saltos de día por zona horaria.
 */
export function normalizeToArgentineMidday(dateStr: string): Date {
  return parseArgentineDate(dateStr, "12:00");
}

/**
 * Formatea una fecha UTC para mostrarla en horario de Argentina
 */
export function formatInArgentina(date: Date, formatStr: string = "PPP"): string {
  // Intl.DateTimeFormat es más robusto para esto sin librerías extra
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "full",
    timeZone: "America/Argentina/Buenos_Aires"
  }).format(date);
}

/**
 * Obtiene la fecha actual en Argentina (como string YYYY-MM-DD)
 */
export function getTodayArgentina(): string {
  return getDateStringArgentina(new Date());
}

/**
 * Obtiene el string de fecha YYYY-MM-DD para cualquier objeto Date en horario de Argentina
 */
export function getDateStringArgentina(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(date);
}

/**
 * Verifica si una fecha/hora ya pasó en el tiempo real de Argentina.
 * Incluye un margen de gracia de 15 minutos.
 */
export function isPastArgentina(date: Date): boolean {
  const GRACE_PERIOD_MS = 15 * 60 * 1000;
  return (date.getTime() + GRACE_PERIOD_MS) < Date.now();
}
