import * as React from "react";
import { LucideCheck, LucideChevronsUpDown, LucideSearch, LucideUserPlus, LucideGlobe, LucideArrowRight, LucideLoader2 } from "lucide-react";
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
import { getCustomersAction, createQuickCustomerAction, searchGlobalUserAction, linkGlobalUserToTenantAction } from "@/lib/actions/customer";
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
  const [globalUsers, setGlobalUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searchingGlobal, setSearchingGlobal] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [forceCreate, setForceCreate] = React.useState(false);

  const loadCustomers = React.useCallback(async () => {
    setLoading(true);
    const res = await getCustomersAction();
    if (res.success) setCustomers(res.data || []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Debounced Global Search
  React.useEffect(() => {
    if (searchValue.length < 3) {
      setGlobalUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingGlobal(true);
      const res = await searchGlobalUserAction(searchValue);
      if (res.success) {
        // Filtrar los que ya son clientes locales
        const localUserIds = new Set(customers.map(c => c.userId).filter(Boolean));
        const filteredGlobal = (res.data || []).filter((u: any) => !localUserIds.has(u.id));
        setGlobalUsers(filteredGlobal);
      }
      setSearchingGlobal(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, customers]);

  const selectedCustomer = customers.find((c) => c.id === value);

  const handleLinkGlobal = async (userId: string) => {
    setIsCreating(true);
    const res = await linkGlobalUserToTenantAction(userId);
    if (res.success && res.data) {
      toast.success("Usuario vinculado correctamente");
      const newCustomer = res.data;
      setCustomers(prev => [newCustomer, ...prev]);
      setValue(newCustomer.id);
      onSelect(newCustomer);
      setOpen(false);
      setSearchValue("");
    } else {
      toast.error(res.error || "Error al vincular usuario");
    }
    setIsCreating(false);
  };

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
      toast.error(res.error || "Error al crear cliente");
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
      <PopoverContent className="w-[400px] p-0 rounded-2xl border-none shadow-2xl overflow-hidden" align="start">
        <Command className="rounded-2xl border-none" shouldFilter={!forceCreate}>
          <CommandInput 
            placeholder="NOMBRE, DNI O TELÉFONO..." 
            value={searchValue}
            onValueChange={(v) => {
              setSearchValue(v);
              if (v === "") setForceCreate(false);
            }}
            className="h-12 border-none focus:ring-0 font-bold uppercase text-[10px] tracking-widest" 
          />
          <CommandList className="max-h-[450px]">
            {!forceCreate && (
              <div className="p-2 border-b border-slate-50">
                <Button 
                  variant="ghost" 
                  onClick={() => setForceCreate(true)}
                  className="w-full justify-start h-10 text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:bg-indigo-50 rounded-lg gap-2"
                >
                  <LucideUserPlus className="h-4 w-4" />
                  Alta Rápida (Cliente Manual)
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
                    {searchingGlobal ? (
                      <div className="flex flex-col items-center gap-3 py-4">
                        <LucideLoader2 className="h-5 w-5 animate-spin text-indigo-600" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buscando en la plataforma...</p>
                      </div>
                    ) : globalUsers.length > 0 ? (
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Resultados en la plataforma</p>
                    ) : (
                      <>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 text-center">No se encontró en tu lista local</p>
                        <Button 
                          onClick={() => setForceCreate(true)}
                          className="w-full h-11 bg-white border border-slate-200 text-slate-900 font-black uppercase text-[10px] tracking-widest rounded-xl shadow-sm hover:bg-slate-50"
                        >
                          Crear como nuevo
                        </Button>
                      </>
                    )}
                  </div>
                </CommandEmpty>

                {/* Resultados Locales */}
                <CommandGroup heading={<span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Mis Clientes</span>}>
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
                  </CommandItem>

                  {customers.filter(c => 
                    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchValue.toLowerCase()) ||
                    c.dni?.includes(searchValue) ||
                    c.phone?.includes(searchValue)
                  ).slice(0, 10).map((customer) => (
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

                {/* Resultados Globales (Plataforma) */}
                {globalUsers.length > 0 && (
                  <CommandGroup heading={
                    <div className="flex items-center gap-2 px-2">
                      <LucideGlobe className="h-3 w-3 text-indigo-500" />
                      <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Encontrados en la plataforma</span>
                    </div>
                  }>
                    {globalUsers.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.id}
                        onSelect={() => handleLinkGlobal(user.id)}
                        className="py-3 px-4 flex items-center justify-between cursor-pointer hover:bg-indigo-600 hover:text-white group rounded-xl mx-1 transition-all"
                      >
                        <div className="flex flex-col">
                          <span className="font-black uppercase text-[11px] tracking-tight group-hover:text-white">
                            {user.name}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-indigo-100 flex gap-2">
                            {user.dni && <span>DNI: {user.dni}</span>}
                            {user.phone && <span>TEL: {user.phone}</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Vincular</span>
                          <LucideArrowRight className="h-4 w-4" />
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
