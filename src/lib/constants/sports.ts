export const SPORTS = [
  { 
    value: "padel", 
    label: "Pádel", 
    icon: "padel",
    color: "blue",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800"
  },
  { 
    value: "tenis", 
    label: "Tenis", 
    icon: "sports_tennis",
    color: "emerald",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800"
  },
  { 
    value: "futbol", 
    label: "Fútbol", 
    icon: "sports_soccer",
    color: "amber",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800"
  },
  { 
    value: "squash", 
    label: "Squash", 
    icon: "sports_tennis",
    color: "slate",
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-800"
  },
  { 
    value: "pickleball", 
    label: "Pickleball", 
    icon: "sports_tennis",
    color: "purple",
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-800"
  },
  { 
    value: "voley", 
    label: "Vóley", 
    icon: "sports_volleyball",
    color: "orange",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-800"
  },
  { 
    value: "basquet", 
    label: "Básquet", 
    icon: "sports_basketball",
    color: "red",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800"
  },
  { 
    value: "handball", 
    label: "Handball", 
    icon: "sports_handball",
    color: "cyan",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    text: "text-cyan-800"
  },
  { 
    value: "hockey", 
    label: "Hockey", 
    icon: "sports_hockey",
    color: "lime",
    bg: "bg-lime-50",
    border: "border-lime-200",
    text: "text-lime-800"
  },
  { 
    value: "hockey_hielo", 
    label: "Hockey sobre Hielo", 
    icon: "ice_skating",
    color: "sky",
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-800"
  }
] as const;

export type SportValue = typeof SPORTS[number]["value"];

export const getSportByValue = (value: string | null) => {
  const normalized = value?.toLowerCase();
  return SPORTS.find(s => s.value === normalized) || SPORTS[0]; // Default to Padel
};

