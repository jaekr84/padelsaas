import { NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings, tenants, sales, saleItems } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || '' 
});

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const dataId = searchParams.get('data.id');
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      console.warn("Webhook received without tenantId");
      return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
    }

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant?.mpAccessToken) {
      console.error("Tenant not found or missing MP access token:", tenantId);
      return NextResponse.json({ error: "Invalid tenant config" }, { status: 400 });
    }

    const client = new MercadoPagoConfig({ 
      accessToken: tenant.mpAccessToken 
    });

    if (type === 'payment' && dataId) {
      const payment = new Payment(client);
      const result = await payment.get({ id: dataId });

      if (result.status === 'approved') {
        const bookingId = result.external_reference;
        const transactionAmount = result.transaction_amount;
        
        if (transactionAmount === undefined) {
          throw new Error("Transaction amount is missing");
        }
        
        if (bookingId) {
          const booking = await db.query.bookings.findFirst({
            where: eq(bookings.id, bookingId),
            with: {
              court: true,
              saleItems: true
            }
          });

          if (booking) {
            const isFullPayment = Number(transactionAmount) >= (booking.price || 0);
            
            await db.transaction(async (tx) => {
              // 1. Actualizar la reserva
              await tx.update(bookings)
                .set({ 
                  status: 'confirmed',
                  paymentStatus: isFullPayment ? 'paid' : 'partially_paid',
                  amountPaid: Number(transactionAmount)
                })
                .where(eq(bookings.id, bookingId));

              // 2. Crear Venta si no existe una vinculada
              if (!booking.saleItems || booking.saleItems.length === 0) {
                const date = new Date();
                const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
                const countResult = await tx.select({ count: sql<number>`count(*)` }).from(sales);
                const saleNumber = `MP-${dateStr}-${(countResult[0].count + 1).toString().padStart(4, "0")}`;

                const [newSale] = await tx.insert(sales).values({
                  saleNumber,
                  customerName: booking.guestName || "Cliente Web (MP)",
                  customerId: booking.customerId,
                  paymentMethod: `MERCADOPAGO (#${dataId})`,
                  terminalId: "WEB/AUTOMÁTICO",
                  centerId: booking.court.centerId,
                  subtotal: transactionAmount.toString(),
                  total: transactionAmount.toString(),
                  // No hay userId aquí ya que es automático
                }).returning();

                await tx.insert(saleItems).values({
                  saleId: newSale.id,
                  bookingId: booking.id,
                  categoryId: "2346a106-97d9-4ca8-b6eb-ea880ad8df0b", // Categoría Canchas
                  quantity: 1,
                  unitPrice: transactionAmount.toString(),
                  totalPrice: transactionAmount.toString(),
                });
              }
            });
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
