"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  LucideSearch, 
  LucideMapPin, 
  LucideTarget, 
  LucideChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import {
  Select,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface ExploreFiltersProps {
  availableSports: string[];
  metaData?: {
    cities: string[];
    states: string[];
    sports: string[];
    cityToStateMap?: Record<string, string>;
  };
}

interface IndustrialSelectProps {
  value: string;
  onValueChange: (v: string) => void;
  options: string[];
  placeholder: string;
  icon: any;
  className?: string;
}

const IndustrialSelect = ({ 
  value, 
  onValueChange, 
  options, 
  placeholder, 
  icon: Icon,
  className
}: IndustrialSelectProps) => {
  const selectedLabel = (value === "all" || !value) 
    ? placeholder 
    : options.find(o => o === value)?.toUpperCase() || value.toUpperCase();

  return (
    <div className={cn("flex-1 min-w-[140px]", className)}>
      <Select value={value} onValueChange={(val) => val && onValueChange(val)}>
        <SelectPrimitive.Trigger className="w-full h-9 bg-slate-900 border border-slate-700 p-0 rounded-none hover:border-blue-800 transition-colors focus:ring-0 outline-none group text-left">
          <div className="flex items-center w-full h-full">
            <div className="px-2 flex-shrink-0 text-slate-500 group-data-[state=open]:text-blue-500 border-r border-slate-800 h-full flex items-center">
              <Icon className="h-3 w-3" />
            </div>
            <div className="px-2 text-[8px] font-black uppercase tracking-widest text-slate-300 flex-grow truncate">
              {selectedLabel}
            </div>
            <div className="px-2 text-slate-600 flex-shrink-0 group-data-[state=open]:rotate-180 transition-transform duration-300">
               <LucideChevronDown className="h-3 w-3" />
            </div>
          </div>
        </SelectPrimitive.Trigger>

        <SelectContent 
          className="bg-slate-900 border border-slate-700 rounded-none shadow-xl p-0 overflow-hidden z-[100]"
          sideOffset={2}
        >
            <SelectItem 
              value="all" 
              className="py-2.5 px-3 font-black uppercase tracking-widest text-[8px] text-slate-400 border-b border-slate-800 last:border-0 data-[highlighted]:bg-blue-600 data-[highlighted]:!text-white transition-colors cursor-pointer outline-none"
            >
              {placeholder}
            </SelectItem>
            {options.map((opt) => (
              <SelectItem 
                key={opt} 
                value={opt}
                className="py-2.5 px-3 font-black uppercase tracking-widest text-[8px] text-slate-400 border-b border-slate-800 last:border-0 data-[highlighted]:bg-blue-600 data-[highlighted]:!text-white transition-colors cursor-pointer outline-none"
              >
                {opt.toUpperCase()}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export function ExploreFilters({ availableSports, metaData }: { availableSports: string[], metaData: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentSport = searchParams.get("sport") || "all";
  const currentCity = searchParams.get("city") || "all";
  const currentState = searchParams.get("state") || "all";
  const currentQuery = searchParams.get("q") || "";
  
  const [search, setSearch] = useState(currentQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const currentQ = params.get("q") || "";
      
      // Solo disparar si la búsqueda cambió realmente
      if (search !== currentQ) {
        if (search) {
          params.set("q", search);
        } else {
          params.delete("q");
        }
        router.push(`/explore?${params.toString()}`, { scroll: false });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search, router, searchParams]);

  const filteredCities = useMemo(() => {
    if (currentState === "all" || !metaData?.cityToStateMap) {
      return metaData?.cities || [];
    }
    return metaData.cities.filter((city: string) => 
      metaData.cityToStateMap[city] === currentState
    );
  }, [currentState, metaData]);

  const handleSportChange = (sportId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sportId === "all") {
      params.delete("sport");
    } else {
      params.set("sport", sportId);
    }
    router.push(`/explore?${params.toString()}`, { scroll: false });
  };

  const handleCityChange = (city: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (city === "all") {
      params.delete("city");
    } else {
      params.set("city", city);
    }
    router.push(`/explore?${params.toString()}`, { scroll: false });
  };

  const handleStateChange = (state: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("city");
    if (state === "all") {
      params.delete("state");
    } else {
      params.set("state", state);
    }
    router.push(`/explore?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-1 items-center gap-2">
      {/* Search Input Compact */}
      <div className="flex-[1.2] min-w-[180px]">
        <div className="w-full bg-slate-900 border border-slate-700 h-9 hover:border-blue-800 transition-colors">
          <div className="flex items-center h-full">
            <div className="px-2 text-slate-500 border-r border-slate-800 h-full flex items-center">
              <LucideSearch className="h-3 w-3" />
            </div>
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="BUSCAR..." 
              className="w-full px-2 text-[8px] font-black uppercase tracking-widest text-slate-300 placeholder:text-slate-600 bg-transparent focus:outline-none"
            />
          </div>
        </div>
      </div>

      <IndustrialSelect 
        value={currentState}
        onValueChange={handleStateChange}
        options={metaData?.states || []}
        placeholder="PROVINCIA"
        icon={LucideMapPin}
      />

      <IndustrialSelect 
        value={currentCity}
        onValueChange={handleCityChange}
        options={filteredCities}
        placeholder="LOCALIDAD"
        icon={LucideMapPin}
      />

      <IndustrialSelect 
        value={currentSport}
        onValueChange={handleSportChange}
        options={metaData?.sports || []}
        placeholder="DEPORTE"
        icon={LucideTarget}
      />
    </div>
  );
}
