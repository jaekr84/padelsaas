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
    <div className="p-6 md:p-10">
      
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
