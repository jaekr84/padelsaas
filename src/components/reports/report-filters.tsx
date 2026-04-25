"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LucideFilter, ChevronDown } from "lucide-react";

export function ReportFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const period = searchParams.get("period") || "month";
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const year = searchParams.get("year") || new Date().getFullYear().toString();

  const handlePeriodChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", val);
    router.push(`?${params.toString()}`);
  };

  const handleMonthChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", val);
    router.push(`?${params.toString()}`);
  };

  const handleYearChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", val);
    router.push(`?${params.toString()}`);
  };

  // Generar últimos 12 meses para el selector
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    months.push({ value, label });
  }

  // Generar últimos 3 años para el selector
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 3; i++) {
    const y = (currentYear - i).toString();
    years.push(y);
  }

  const selectedMonthLabel = months.find(m => m.value === month)?.label || "Seleccionar Mes";
  const selectedYearLabel = `Año ${year}`;

  return (
    <Card className="p-2 border-none shadow-sm rounded-3xl bg-white flex flex-col md:flex-row items-center gap-3">
      <div className="flex items-center gap-2 text-slate-500 pl-2">
        <LucideFilter className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">Filtros</span>
      </div>
      
      <div className="flex flex-1 flex-col md:flex-row gap-2 w-full">
        {/* Selector de Periodo */}
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" className="rounded-xl bg-slate-50/50 font-bold text-[10px] uppercase tracking-tight h-8 gap-2">
              {period === "month" ? "Vista Mensual" : "Vista Anual"}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          } />
          <DropdownMenuContent className="rounded-xl border-none shadow-xl min-w-40">
            <DropdownMenuRadioGroup value={period} onValueChange={handlePeriodChange}>
              <DropdownMenuRadioItem value="month" className="font-bold text-[10px] uppercase">Vista Mensual</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="year" className="font-bold text-[10px] uppercase">Vista Anual</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Selector de Mes o Año según periodo */}
        {period === "month" ? (
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" className="rounded-xl bg-slate-50/50 font-bold text-[10px] uppercase tracking-tight h-8 gap-2">
                {selectedMonthLabel}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            } />
            <DropdownMenuContent className="rounded-xl border-none shadow-xl max-h-60 overflow-y-auto min-w-48">
              <DropdownMenuRadioGroup value={month} onValueChange={handleMonthChange}>
                {months.map((m) => (
                  <DropdownMenuRadioItem key={m.value} value={m.value} className="font-bold text-[10px] uppercase">
                    {m.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" className="rounded-xl bg-slate-50/50 font-bold text-[10px] uppercase tracking-tight h-8 gap-2">
                {selectedYearLabel}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            } />
            <DropdownMenuContent className="rounded-xl border-none shadow-xl min-w-32">
              <DropdownMenuRadioGroup value={year} onValueChange={handleYearChange}>
                {years.map((y) => (
                  <DropdownMenuRadioItem key={y} value={y} className="font-bold text-[10px] uppercase">
                    Año {y}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Card>
  );
}
