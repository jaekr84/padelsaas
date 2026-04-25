"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  Legend
} from "recharts";

interface DashboardChartsProps {
  categoryData: { name: string, value: number }[];
  paymentData: { name: string, value: number }[];
  trendData: { date: string, amount: number }[];
  yearData: { month: string, amount: number }[];
}

// Estándar Industrial: Azules y Negros Sólidos
const COLORS = ["#003399", "#000000", "#1e293b", "#334155", "#475569", "#64748b"];

export function DashboardCharts({ categoryData, paymentData, trendData, yearData }: DashboardChartsProps) {
  return (
    <div className="grid gap-px bg-slate-200 border border-slate-200 overflow-hidden">
      {/* Gráfico de Tendencia (Ancho) */}
      <div className="lg:col-span-7 bg-white p-5">
        <div className="flex flex-col gap-1 mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Tendencia de Ingresos</h3>
          <p className="text-[10px] font-mono text-slate-400 uppercase">Evolución de flujo de caja</p>
        </div>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={{ stroke: '#e2e8f0' }} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '0', 
                  border: '1px solid #e2e8f0', 
                  boxShadow: 'none',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }} 
              />
              <Area 
                type="stepAfter" 
                dataKey="amount" 
                stroke="#003399" 
                strokeWidth={2}
                fillOpacity={0.05} 
                fill="#003399" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-7 gap-px">
        {/* Ventas por Categoría */}
        <div className="lg:col-span-3 bg-white p-5">
          <div className="flex flex-col gap-1 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Distribución de Inventario</h3>
          </div>
          <div className="h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={100}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '0', 
                    border: '1px solid #e2e8f0',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ventas por Medio de Pago */}
        <div className="lg:col-span-4 bg-white p-5">
          <div className="flex flex-col gap-1 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Métodos de Recaudación</h3>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={{ stroke: '#e2e8f0' }} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '0', 
                    border: '1px solid #e2e8f0',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }} 
                />
                <Bar 
                  dataKey="value" 
                  fill="#000000" 
                  radius={0} 
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ventas Últimos 12 Meses */}
      <div className="lg:col-span-7 bg-white p-5">
        <div className="flex flex-col gap-1 mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Histórico de Ventas (Anual)</h3>
        </div>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearData}>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                axisLine={{ stroke: '#e2e8f0' }} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ 
                  borderRadius: '0', 
                  border: '1px solid #e2e8f0',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }} 
              />
              <Bar 
                dataKey="amount" 
                fill="#003399" 
                radius={0} 
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
