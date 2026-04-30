"use server"

import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from '@/db';
import { bookings, courts, centers, tenants } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

// Ya no usamos un cliente global estático si queremos multi-tenant dinámico
// Pero podemos inicializar uno por request o usar una caché si fuera necesario.

export async function createBookingPreferenceAction(bookingId: string) {
  try {
    // 1. Obtener la reserva usando SQL Crudo (Máxima compatibilidad)
    const bookingRes = await db.execute(sql`SELECT * FROM booking WHERE id = ${bookingId} LIMIT 1`);
    const booking = bookingRes.rows[0] as any;
    if (!booking) throw new Error("Booking not found");

    // 2. Obtener relaciones secuencialmente usando SQL Crudo
    const courtRes = await db.execute(sql`SELECT * FROM court WHERE id = ${booking.court_id} LIMIT 1`);
    const court = courtRes.rows[0] as any;

    const centerRes = court ? await db.execute(sql`SELECT * FROM center WHERE id = ${court.center_id} LIMIT 1`) : { rows: [] };
    const center = centerRes.rows[0] as any;

    const tenantRes = center ? await db.execute(sql`SELECT * FROM tenant WHERE id = ${center.tenant_id} LIMIT 1`) : { rows: [] };
    const tenant = tenantRes.rows[0] as any;

    if (!court || !center || !tenant) {
      throw new Error("No se pudo encontrar la información del centro para procesar el pago");
    }

    if (!tenant.mp_access_token) {
      throw new Error("El centro no tiene configurado Mercado Pago");
    }

    const client = new MercadoPagoConfig({
      accessToken: tenant.mp_access_token
    });

    const totalAmount = Number(booking.price) || 0;
    const paymentAmount = Math.ceil(totalAmount * 0.5); // 50% mínimo

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: booking.id,
            title: `Reserva Cancha: ${court.name}`,
            quantity: 1,
            unit_price: paymentAmount,
            currency_id: 'ARS',
          }
        ],
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/success?bookingId=${booking.id}`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/failure?bookingId=${booking.id}`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/pending?bookingId=${booking.id}`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.MP_WEBHOOK_URL}/api/webhooks/mercadopago?tenantId=${tenant.id}`,
        external_reference: booking.id,
      }
    });

    // Guardar el preferenceId en la reserva
    await db.execute(sql`
      UPDATE booking 
      SET payment_preference_id = ${result.id}, 
          amount_paid = ${paymentAmount}
      WHERE id = ${bookingId}
    `);

    return {
      success: true,
      preferenceId: result.id,
      initPoint: result.init_point
    };
  } catch (error: any) {
    console.error("--- ERROR CRÍTICO EN MERCADO PAGO ---");
    console.error("Mensaje:", error.message);
    if (error.code) console.error("Código DB:", error.code);
    if (error.detail) console.error("Detalle DB:", error.detail);
    if (error.hint) console.error("Sugerencia DB:", error.hint);
    console.error("Stack:", error.stack);

    return { success: false, error: error.message || "Error interno del servidor" };
  }
}
