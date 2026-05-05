"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getProvinces, getLocalities, type Province, type Locality } from "@/lib/georef";

interface GeorefSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

export function ProvinceSelect({ value, onChange, placeholder, disabled, error }: GeorefSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [provinces, setProvinces] = React.useState<Province[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getProvinces();
      setProvinces(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "w-full justify-between h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold uppercase text-xs",
            error && "border-red-500",
            !value && "text-muted-foreground font-normal"
          )}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Cargando...</span>
            </div>
          ) : value ? (
            provinces.find((p) => p.nombre.toLowerCase() === value.toLowerCase())?.nombre || value
          ) : (
            placeholder || "Seleccionar Provincia"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      } />
      <PopoverContent className="w-full p-0 rounded-none border-slate-200 shadow-2xl z-[100]" align="start">
        <Command className="rounded-none">
          <CommandInput placeholder="Buscar provincia..." className="h-10 text-xs font-bold uppercase" />
          <CommandList>
            <CommandEmpty className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              No se encontraron resultados.
            </CommandEmpty>
            <CommandGroup>
              {provinces.map((province) => (
                <CommandItem
                  key={province.id}
                  value={province.nombre}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                  className="text-[10px] font-black uppercase tracking-widest py-3 cursor-pointer data-[highlighted]:bg-slate-950 data-[highlighted]:text-white"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3 w-3",
                      value.toLowerCase() === province.nombre.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {province.nombre}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function LocalitySelect({ 
  value, 
  onChange, 
  provinceName, 
  disabled, 
  error,
  placeholder
}: GeorefSelectProps & { provinceName: string }) {
  const [open, setOpen] = React.useState(false);
  const [localities, setLocalities] = React.useState<Locality[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!provinceName) {
      setLocalities([]);
      return;
    }
    async function load() {
      setLoading(true);
      const data = await getLocalities(provinceName);
      setLocalities(data);
      setLoading(false);
    }
    load();
  }, [provinceName]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading || !provinceName}
          className={cn(
            "w-full justify-between h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold uppercase text-xs",
            error && "border-red-500",
            !value && "text-muted-foreground font-normal",
            !provinceName && "opacity-50 cursor-not-allowed"
          )}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Cargando...</span>
            </div>
          ) : value ? (
            localities.find((l) => l.nombre.toLowerCase() === value.toLowerCase())?.nombre || value
          ) : (
            provinceName ? (placeholder || "Seleccionar Localidad") : "Primero elige provincia"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      } />
      <PopoverContent className="w-full p-0 rounded-none border-slate-200 shadow-2xl z-[100]" align="start">
        <Command className="rounded-none">
          <CommandInput placeholder="Buscar localidad..." className="h-10 text-xs font-bold uppercase" />
          <CommandList>
            <CommandEmpty className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              No se encontraron resultados.
            </CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {localities.map((locality) => (
                <CommandItem
                  key={locality.id}
                  value={locality.nombre}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                  className="text-[10px] font-black uppercase tracking-widest py-3 cursor-pointer data-[highlighted]:bg-slate-950 data-[highlighted]:text-white"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3 w-3",
                      value.toLowerCase() === locality.nombre.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {locality.nombre}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
