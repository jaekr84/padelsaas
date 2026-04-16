import { getBookingsListAction } from "@/lib/actions/reservation-actions";
import { BookingsList } from "@/components/bookings-list";
import { Suspense } from "react";

export default async function BookingsPage(props: {
  params?: Promise<any>;
  searchParams?: Promise<any>;
}) {
  const searchParams = await props.searchParams;
  const dateParam = searchParams?.date || undefined;

  const bookings = await getBookingsListAction(dateParam);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reservas</h2>
          <p className="text-muted-foreground">
            Control de todas las reservas y recaudación del día.
          </p>
        </div>
      </div>
      
      <div className="pt-4">
        <Suspense fallback={<div>Cargando reservas...</div>}>
          <BookingsList 
            bookings={bookings} 
            globalDate={dateParam}
          />
        </Suspense>
      </div>
    </div>
  );
}
