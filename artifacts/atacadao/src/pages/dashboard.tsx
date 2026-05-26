import React, { useMemo } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useGetStockSummary, useGetMe, useListStockItems } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package, Hash, MapPin, ArrowRight, AlertTriangle,
  Calendar, TrendingUp, Thermometer
} from "lucide-react";
import { Button } from "@/components/ui/button";

function parseExpiry(expiryDate: string): Date | null {
  const parts = expiryDate.split("/");
  if (parts.length !== 2) return null;
  const month = parseInt(parts[0], 10);
  const year = parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(year)) return null;
  return new Date(year, month - 1, 1);
}

function getDaysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetStockSummary();
  const { data: user } = useGetMe();
  const { data: items } = useListStockItems();

  const expiryAlerts = useMemo(() => {
    if (!items) return [];
    return items
      .filter((item) => {
        if (!item.expiryDate) return false;
        const date = parseExpiry(item.expiryDate);
        if (!date) return false;
        return getDaysUntil(date) <= 30;
      })
      .map((item) => {
        const date = parseExpiry(item.expiryDate!)!;
        return { ...item, daysLeft: getDaysUntil(date) };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5);
  }, [items]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">{greeting()}</p>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mt-1">
          {user?.username}
        </h1>
        <p className="text-base text-gray-500 dark:text-gray-400 mt-1 font-medium flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-primary" />
          Câmara Fria — visão geral do armazém
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="relative overflow-hidden border-0 bg-primary text-white shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Paletes</p>
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
            </div>
            {isLoadingSummary ? (
              <Skeleton className="h-12 w-16 bg-white/20" />
            ) : (
              <div className="text-5xl font-black leading-none">{summary?.totalItems ?? 0}</div>
            )}
            <p className="text-white/70 text-xs mt-2 font-medium">em estoque</p>
          </CardContent>
          <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gray-900 dark:bg-zinc-800 text-white shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Códigos</p>
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                <Hash className="h-5 w-5 text-white" />
              </div>
            </div>
            {isLoadingSummary ? (
              <Skeleton className="h-12 w-16 bg-white/20" />
            ) : (
              <div className="text-5xl font-black leading-none">{summary?.totalCodes ?? 0}</div>
            )}
            <p className="text-white/70 text-xs mt-2 font-medium">na balança</p>
          </CardContent>
          <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <Link href="/estoque">
          <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 border-2 border-gray-100 dark:border-zinc-800 hover:border-primary/50 rounded-xl px-5 py-4 cursor-pointer transition-all group shadow-sm">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-gray-900 dark:text-white">Gerenciar Estoque</p>
              <p className="text-xs text-gray-500 mt-0.5">Paletes, validades e localizações</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
          </div>
        </Link>
        <Link href="/codigos">
          <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 border-2 border-gray-100 dark:border-zinc-800 hover:border-gray-400 rounded-xl px-5 py-4 cursor-pointer transition-all group shadow-sm">
            <div className="h-11 w-11 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-gray-200 dark:group-hover:bg-zinc-700 transition-colors">
              <Hash className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-gray-900 dark:text-white">Consultar Códigos</p>
              <p className="text-xs text-gray-500 mt-0.5">Códigos para pesagem na balança</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-1 transition-all shrink-0" />
          </div>
        </Link>
      </div>

      {/* Expiry Alerts */}
      {expiryAlerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-black mb-3 flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Validades Próximas
          </h2>
          <div className="space-y-2">
            {expiryAlerts.map((item) => (
              <div key={item.id} className={`flex items-center gap-3 rounded-xl px-4 py-3 border-2 ${
                item.daysLeft <= 0
                  ? "bg-red-50 border-red-200 dark:bg-red-950/20"
                  : item.daysLeft <= 7
                  ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20"
                  : "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/10"
              }`}>
                <Calendar className={`h-5 w-5 shrink-0 ${
                  item.daysLeft <= 0 ? "text-red-500" :
                  item.daysLeft <= 7 ? "text-amber-500" : "text-yellow-500"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate text-gray-900 dark:text-white">{item.productName}</p>
                  <p className="text-xs text-gray-500">{item.location}</p>
                </div>
                <div className={`text-right shrink-0`}>
                  <p className={`text-xs font-black ${
                    item.daysLeft <= 0 ? "text-red-600" :
                    item.daysLeft <= 7 ? "text-amber-600" : "text-yellow-600"
                  }`}>
                    {item.daysLeft <= 0 ? "VENCIDO" :
                     item.daysLeft === 1 ? "1 dia" :
                     `${item.daysLeft} dias`}
                  </p>
                  <p className="text-xs text-gray-400">{item.expiryDate}</p>
                </div>
              </div>
            ))}
            {(items?.filter(i => {
              if (!i.expiryDate) return false;
              const d = parseExpiry(i.expiryDate);
              return d ? getDaysUntil(d) <= 30 : false;
            }).length ?? 0) > 5 && (
              <Link href="/estoque">
                <Button variant="outline" className="w-full h-10 font-bold text-sm border-2 mt-1">
                  Ver todos <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Location Breakdown */}
      <div>
        <h2 className="text-lg font-black mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Ocupação por Câmara
        </h2>

        {isLoadingSummary ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : summary?.locationBreakdown && summary.locationBreakdown.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {summary.locationBreakdown.map((loc) => (
              <Link key={loc.location} href={`/estoque`}>
                <div className="bg-white dark:bg-zinc-900 border-2 border-gray-100 dark:border-zinc-800 hover:border-primary/40 rounded-xl px-5 py-4 flex items-center gap-4 transition-all cursor-pointer shadow-sm group">
                  <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-inner">
                    <span className="text-white font-black text-lg">{loc.count}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{loc.location}</p>
                    <p className="text-xs text-gray-500">{loc.count === 1 ? "1 palete" : `${loc.count} paletes`}</p>
                  </div>
                  <MapPin className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/30 rounded-xl border-2 border-dashed">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum item em estoque no momento.</p>
            <Link href="/estoque">
              <Button className="mt-4 font-bold">Adicionar Palete</Button>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
