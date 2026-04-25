"use client";

import * as React from "react";
import { LucideCheck, LucideChevronsUpDown, LucideSearch, LucideUserPlus } from "lucide-react";
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
import { getCustomersAction, createQuickCustomerAction } from "@/lib/actions/customer";
import { toast } from "sonner";

interface CustomerSelectProps {
  onSelect: (customer: any) => void;
  defaultValue?: string | null;
  className?: string;
  placeholder?: string;
}

export function CustomerSelect({ onSelect, defaultValue, className, placeholder = "Buscar cliente..." }: CustomerSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(defaultValue || "");
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  const loadCustomers = React.useCallback(async () => {
    setLoading(true);
    const res = await getCustomersAction();
    if (res.success) setCustomers(res.data || []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const selectedCustomer = customers.find((c) => c.id === value);

  const [forceCreate, setForceCreate] = React.useState(false);

  const handleQuickCreate = async () => {
    if (!searchValue.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setIsCreating(true);
    const res = await createQuickCustomerAction({
      firstName: searchValue.trim(),
      phone: phone.trim() || undefined,
    });
    if (res.success && res.data) {
      toast.success("Cliente creado y seleccionado");
      const newCustomer = res.data;
      setCustomers(prev => [newCustomer, ...prev]);
      setValue(newCustomer.id);
      onSelect(newCustomer);
      setOpen(false);
      setPhone("");
      setSearchValue("");
      setForceCreate(false);
    } else {
      toast.error("Error al crear cliente");
    }
    setIsCreating(false);
  };

  return (
    <Popover open={open} onOpenChange={(o) => {
      setOpen(o);
      if (!o) {
        setForceCreate(false);
        setPhone("");
      }
    }}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between h-14 bg-slate-50/50 border-slate-100 text-slate-900 font-bold rounded-xl px-6 focus:bg-white transition-all", className)}
          >
            {selectedCustomer 
              ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`.toUpperCase()
              : placeholder.toUpperCase()}
            <LucideChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-[350px] p-0 rounded-2xl border-none shadow-2xl overflow-hidden" align="start">
        <Command className="rounded-2xl border-none" shouldFilter={!forceCreate}>
          <CommandInput 
            placeholder="Nombre o DNI..." 
            value={searchValue}
            onValueChange={(v) => {
              setSearchValue(v);
              if (v === "") setForceCreate(false);
            }}
            className="h-12 border-none focus:ring-0 font-bold uppercase text-[10px] tracking-widest" 
          />
          <CommandList className="max-h-[350px]">
            {!forceCreate && (
              <div className="p-2 border-b border-slate-50">
                <Button 
                  variant="ghost" 
                  onClick={() => setForceCreate(true)}
                  className="w-full justify-start h-10 text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:bg-indigo-50 rounded-lg gap-2"
                >
                  <LucideUserPlus className="h-4 w-4" />
                  Nuevo Cliente Manual
                </Button>
              </div>
            )}

            {forceCreate && (
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nuevo Registro</p>
                  <Button variant="ghost" size="sm" onClick={() => setForceCreate(false)} className="h-6 text-[9px] font-bold uppercase">Cancelar</Button>
                </div>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Nombre</p>
                    <input 
                      type="text"
                      autoFocus
                      placeholder="Nombre del cliente"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      className="w-full text-xs font-black text-slate-900 uppercase bg-transparent outline-none border-none p-0"
                    />
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Teléfono</p>
                    <input 
                      type="text"
                      placeholder="Eje: 11 1234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs font-black text-slate-900 uppercase bg-transparent outline-none border-none p-0"
                    />
                  </div>
                  <Button 
                    onClick={handleQuickCreate}
                    disabled={isCreating || !searchValue.trim()}
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-indigo-200"
                  >
                    {isCreating ? "CREANDO..." : "CONFIRMAR REGISTRO"}
                  </Button>
                </div>
              </div>
            )}

            {!forceCreate && (
              <>
                <CommandEmpty className="p-0 overflow-hidden">
                  <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 text-center">No se encontró "{searchValue}"</p>
                    <Button 
                      onClick={() => setForceCreate(true)}
                      className="w-full h-11 bg-white border border-slate-200 text-slate-900 font-black uppercase text-[10px] tracking-widest rounded-xl shadow-sm hover:bg-slate-50"
                    >
                      Crear "{searchValue}"
                    </Button>
                  </div>
                </CommandEmpty>
                <CommandGroup heading={<span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Clientes Recientes</span>}>
                  <CommandItem
                    value="consumidor_final"
                    onSelect={() => {
                      setValue("");
                      onSelect(null);
                      setOpen(false);
                      setSearchValue("");
                    }}
                    className="py-3 px-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded-xl mx-1"
                  >
                    <div className="flex flex-col">
                      <span className="font-black text-slate-400 uppercase text-[11px] tracking-tight">
                        Consumidor Final
                      </span>
                    </div>
                    <LucideCheck
                      className={cn(
                        "h-4 w-4 text-indigo-600",
                        !value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>

                  {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={`${customer.firstName} ${customer.lastName} ${customer.dni || ""} ${customer.phone || ""}`}
                  onSelect={() => {
                    setValue(customer.id);
                    onSelect(customer);
                    setOpen(false);
                    setSearchValue("");
                  }}
                  className="py-3 px-4 flex items-center justify-between cursor-pointer hover:bg-indigo-50 rounded-xl mx-1"
                >
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 uppercase text-[11px] tracking-tight">
                      {customer.firstName} {customer.lastName}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex gap-2">
                      {customer.dni && <span>DNI: {customer.dni}</span>}
                      {customer.phone && <span>TEL: {customer.phone}</span>}
                    </span>
                  </div>
                  <LucideCheck
                    className={cn(
                      "h-4 w-4 text-indigo-600",
                      value === customer.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
  );
}
