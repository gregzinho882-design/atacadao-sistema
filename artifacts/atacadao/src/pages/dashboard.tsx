import React from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useGetStockSummary, useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Hash, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetStockSummary();
  const { data: user } = useGetMe();

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
          Olá, {user?.username}
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 font-medium">
          Visão geral do armazém
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-bold text-gray-500 uppercase tracking-wider">Paletes em Estoque</CardTitle>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Package className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <div className="text-5xl font-black text-gray-900 dark:text-white">
                {summary?.totalItems || 0}
              </div>
            )}
            <div className="mt-6">
              <Link href="/estoque">
                <Button className="w-full md:w-auto font-bold h-12 text-base group">
                  GERENCIAR ESTOQUE
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-800 dark:border-l-gray-200 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-bold text-gray-500 uppercase tracking-wider">Códigos de Balança</CardTitle>
            <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-900 dark:text-white">
              <Hash className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <div className="text-5xl font-black text-gray-900 dark:text-white">
                {summary?.totalCodes || 0}
              </div>
            )}
            <div className="mt-6">
              <Link href="/codigos">
                <Button variant="outline" className="w-full md:w-auto font-bold h-12 text-base border-2 group">
                  CONSULTAR CÓDIGOS
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <MapPin className="h-6 w-6 text-primary" />
        Ocupação por Câmara Fria
      </h2>

      {isLoadingSummary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : summary?.locationBreakdown && summary.locationBreakdown.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.locationBreakdown.map((loc) => (
            <Card key={loc.location} className="shadow-sm">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Câmara / Corredor</p>
                  <p className="text-xl font-black mt-1">{loc.location}</p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary text-white font-bold text-xl shadow-inner">
                    {loc.count}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 bg-gray-50 dark:bg-gray-900/50">
          <CardContent className="p-10 text-center">
            <p className="text-gray-500 font-medium text-lg">Nenhum item em estoque no momento.</p>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
}
