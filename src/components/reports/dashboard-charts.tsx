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
  Area
} from "recharts";

import React, { useState, useEffect } from "react";
import { LucideActivity, LucidePieChart, LucideBarChart3, LucideCalendarDays } from "lucide-react";

interface DashboardChartsProps {
  categoryData: { name: string, value: number }[];
  paymentData: { name: string, value: number }[];
  trendData: { date: string, amount: number }[];
  yearData: { month: string, amount: number }[];
}

const COLORS = ["#2563eb", "#020617", "#475569", "#94a3b8", "#cbd5e1"];

export function DashboardCharts({ categoryData, paymentData, trendData, yearData }: DashboardChartsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Skeleton Industrial mientras carga para evitar parpadeo y errores de tamaño
  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="h-[400px] bg-slate-50 border-2 border-slate-950 animate-pulse flex items-center justify-center">
          <p className="font-black uppercase tracking-widest text-slate-200 text-xs italic">Cargando Datos Industriales...</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-[300px] bg-slate-50 border-2 border-slate-950 animate-pulse" />
          <div className="h-[300px] bg-slate-50 border-2 border-slate-950 animate-pulse" />
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 border-2 border-slate-950 p-3 shadow-[4px_4px_0px_rgba(37,99,235,1)]">
          <p className="text-[10px] font-black uppercase text-blue-400 mb-1">{label}</p>
          <p className="text-sm font-bold text-white tabular-nums">
            ${payload[0].value.toLocaleString('es-AR')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* 1. Gráfico de Tendencia (Industrial Clean) */}
      <div className="bg-white border border-slate-200 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
          <LucideActivity className="h-32 w-32" />
        </div>
        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-100">
          <div className="bg-blue-600 text-white p-2.5">
            <LucideCalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">Tendencia de Ingresos</h3>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Flujo de caja consolidado de ventas</p>
          </div>
        </div>
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={{ stroke: '#f1f5f9' }}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#2563eb"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorAmount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 2. Ventas por Categoría (Modern Pie) */}
        <div className="bg-white border border-slate-200 p-8">
          <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-100">
            <div className="bg-slate-900 text-white p-2.5">
              <LucidePieChart className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">Distribución por Categoría</h3>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="40%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {categoryData.slice(0, 4).map((entry, i) => (
              <div key={entry.name} className="flex items-center justify-between border-b border-slate-50 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[10px] font-bold uppercase text-slate-600 truncate">{entry.name}</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400">${entry.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Ventas por Medio de Pago (Clean Bar) */}
        <div className="bg-white border border-slate-200 p-8">
          <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-100">
            <div className="bg-blue-600 text-white p-2.5">
              <LucideBarChart3 className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">Medios de Recaudación</h3>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={{ stroke: '#f1f5f9' }}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                />
                <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                <Bar
                  dataKey="value"
                  fill="#0f172a"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Histórico Anual */}
      <div className="bg-white border border-slate-200 p-8">
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 text-white p-2.5">
              <LucideActivity className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">Histórico de Ventas (Anual)</h3>
          </div>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                axisLine={{ stroke: '#f1f5f9' }}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
              />
              <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
              <Bar
                dataKey="amount"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
