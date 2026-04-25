/**
 * Utilidades de formateo estandarizadas para Argentina
 */

/**
 * Formatea un número a moneda argentina ($ 1.250,50)
 */
export const formatCurrency = (amount: number | string | null | undefined) => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (value === null || value === undefined || isNaN(value)) return "$ 0,00";
  
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formatea una fecha a DD/MM/YYYY
 */
export const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "--/--/----";
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
};

/**
 * Formatea fecha y hora DD/MM/YYYY HH:mm
 */
export const formatDateTime = (date: Date | string | null | undefined) => {
  if (!date) return "--/--/---- --:--";
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
};

/**
 * Formatea solo la hora HH:mm
 */
export const formatTime = (date: Date | string | null | undefined) => {
  if (!date) return "--:--";
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
};

/**
 * Capitaliza la primera letra de cada palabra
 */
export const capitalize = (str: string) => {
  if (!str) return "";
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};
