import React from "react";
import { db } from "@/db";
import { bookings, courts, centers, tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { PaymentContinue } from "@/components/public-booking/payment-continue";
import { LucideBox } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BookingPayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);

  if (!booking) {
    notFound();
  }

  // Fetch relations separately using core API
  const [court] = await db.select().from(courts).where(eq(courts.id, booking.courtId)).limit(1);
  const [center] = court ? await db.select().from(centers).where(eq(centers.id, court.centerId)).limit(1) : [null];
  const [tenant] = center ? await db.select().from(tenants).where(eq(tenants.id, center.tenantId)).limit(1) : [null];

  if (!court || !center || !tenant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border-2 border-slate-950 p-12 text-center space-y-6 max-w-md shadow-[8px_8px_0px_black]">
          <h2 className="text-xl font-black uppercase tracking-tighter">Error de Reserva</h2>
          <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest leading-relaxed">
            No se pudo encontrar la información del centro para procesar el pago.
          </p>
          <Link href="/profile" className="inline-block px-6 py-3 bg-slate-950 text-white font-black uppercase tracking-widest text-[9px]">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  // Verificar que la reserva pertenezca al usuario
  const isOwner = booking.userId === session.user?.id;
  if (!isOwner) {
    redirect("/profile");
  }

  if (booking.status === "confirmed" || booking.paymentStatus === "paid") {
    redirect("/profile");
  }

  const publicKey = tenant.mpPublicKey;
  if (!publicKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border-2 border-slate-950 p-12 text-center space-y-6 max-w-md shadow-[8px_8px_0px_black]">
          <h2 className="text-xl font-black uppercase tracking-tighter">Error de Configuración</h2>
          <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest leading-relaxed">
            Este centro no tiene configurado Mercado Pago para pagos online.
          </p>
          <Link href="/profile" className="inline-block px-6 py-3 bg-slate-950 text-white font-black uppercase tracking-widest text-[9px]">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
       <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b-2 border-slate-950 px-6 flex items-center justify-between z-50">
          <Link href="/profile" className="flex items-center gap-3">
             <div className="h-8 w-8 bg-slate-950 flex items-center justify-center text-white">
                <LucideBox className="h-4 w-4" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">PAGAR RESERVA</span>
          </Link>
       </nav>
       <div className="max-w-4xl mx-auto">
          <PaymentContinue 
            bookingId={booking.id}
            publicKey={publicKey}
            totalPrice={booking.price || 0}
            centerName={center.name}
          />
       </div>
    </div>
  );
}
