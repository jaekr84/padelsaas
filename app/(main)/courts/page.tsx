import { getCourtsAction } from "@/lib/actions/court";
import { getCenterAction } from "@/lib/actions/center";
import { CourtsList } from "@/components/courts-list";

export default async function CourtsPage(props: {
  params?: Promise<any>;
  searchParams?: Promise<any>;
}) {
  const searchParams = await props.searchParams;
  const dateParam = searchParams?.date || undefined;

  const courts = await getCourtsAction(dateParam);
  const center = await getCenterAction();
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Canchas</h2>
          <p className="text-muted-foreground">
            Administra las canchas disponibles en tu centro.
          </p>
        </div>
      </div>
      
      <div className="pt-4">
        <CourtsList 
          courts={courts} 
          center={center}
          globalDate={dateParam}
        />
      </div>
    </div>
  );
}
