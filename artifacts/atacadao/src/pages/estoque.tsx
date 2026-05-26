import React, { useState, useRef, useMemo } from "react";
import { Layout } from "@/components/layout";
import {
  useListStockItems,
  useCreateStockItem,
  useUpdateStockItem,
  useDeleteStockItem,
  getListStockItemsQueryKey,
  getGetStockSummaryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useExpiryNotifications } from "@/hooks/use-expiry-notifications";
import { parseExpiry, getDaysUntil, getExpiryStatus } from "@/lib/expiry";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, MapPin, Package, Edit, Trash2, FileText,
  Loader2, Hash, Calendar, ChevronsDown, ChevronsUp, AlertTriangle,
  SlidersHorizontal, X, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const stockItemSchema = z.object({
  palletNumber: z.string().optional(),
  productName: z.string().min(1, "Nome do produto é obrigatório"),
  location: z.string().min(1, "Localização é obrigatória"),
  description: z.string().optional(),
  expiryDate: z.string().optional(),
});

type StockItemFormValues = z.infer<typeof stockItemSchema>;

function maskDate(value: string): string {
  let v = value.replace(/\D/g, "");
  if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
  if (v.length >= 6) v = v.slice(0, 5) + "/" + v.slice(5, 7);
  return v.slice(0, 8);
}

function StockForm({
  form,
  onSubmit,
  isPending,
  submitLabel,
}: {
  form: ReturnType<typeof useForm<StockItemFormValues>>;
  onSubmit: (data: StockItemFormValues) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="palletNumber" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-bold uppercase text-gray-600">Nº do Palete</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 42" className="h-12 text-base font-mono" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="expiryDate" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-bold uppercase text-gray-600">Validade</FormLabel>
              <FormControl>
                <Input
                  placeholder="DD/MM/AA"
                  className="h-12 text-base font-mono"
                  maxLength={8}
                  {...field}
                  onChange={(e) => field.onChange(maskDate(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="productName" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-bold uppercase text-gray-600">Produto</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Frango Congelado CX 15KG" className="h-12 text-base" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="location" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-bold uppercase text-gray-600">Câmara / Localização</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Câmara Fria Carnes - Seção A" className="h-12 text-base" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-bold uppercase text-gray-600">Observações (Opcional)</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Lote com vencimento próximo" className="h-12 text-base" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full h-12 text-base font-bold" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : submitLabel}
        </Button>
      </form>
    </Form>
  );
}

export default function Estoque() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: items, isLoading } = useListStockItems();
  const createMutation = useCreateStockItem();
  const updateMutation = useUpdateStockItem();
  const deleteMutation = useDeleteStockItem();

  useExpiryNotifications();

  const form = useForm<StockItemFormValues>({
    resolver: zodResolver(stockItemSchema),
    defaultValues: { palletNumber: "", productName: "", location: "", description: "", expiryDate: "" },
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: getListStockItemsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStockSummaryQueryKey() });
  };

  const onSubmit = (data: StockItemFormValues) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data }, {
        onSuccess: () => { invalidateQueries(); setEditingItem(null); toast({ title: "Item atualizado" }); }
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => { invalidateQueries(); setIsAddOpen(false); form.reset(); toast({ title: "Item adicionado" }); }
      });
    }
  };

  const handleEdit = (item: any) => {
    form.reset({
      palletNumber: item.palletNumber ?? "",
      productName: item.productName,
      location: item.location,
      description: item.description ?? "",
      expiryDate: item.expiryDate ?? "",
    });
    setEditingItem(item);
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteMutation.mutate({ id: deletingId }, {
        onSuccess: () => { invalidateQueries(); setDeletingId(null); toast({ title: "Item removido" }); }
      });
    }
  };

  const toggleLocation = (loc: string) => {
    setSelectedLocations(prev => {
      const next = new Set(prev);
      if (next.has(loc)) next.delete(loc);
      else next.add(loc);
      return next;
    });
  };

  const clearFilters = () => setSelectedLocations(new Set());

  const uniqueLocations = useMemo(() => {
    if (!items) return [];
    return Array.from(new Set(items.map((i) => i.location))).sort();
  }, [items]);

  const expiringCount = useMemo(() => {
    if (!items) return 0;
    return items.filter((i) => {
      const s = getExpiryStatus(i.expiryDate);
      return s === "expired" || s === "soon";
    }).length;
  }, [items]);

  const filteredItems = useMemo(() => {
    return (items ?? []).filter(item => {
      const matchesSearch =
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.palletNumber ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = selectedLocations.size === 0 || selectedLocations.has(item.location);
      return matchesSearch && matchesLocation;
    });
  }, [items, searchTerm, selectedLocations]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });

  const hasActiveFilters = selectedLocations.size > 0;

  return (
    <Layout fab={{ label: "Novo Palete", onClick: () => setIsAddOpen(true) }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Estoque</h1>
          <p className="text-gray-500 font-medium mt-1">Gerencie a localização dos paletes na câmara fria</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) form.reset(); setIsAddOpen(open); }}>
          <DialogTrigger asChild>
            <Button className="h-12 px-5 text-base font-bold shadow-md w-full md:w-auto">
              <Plus className="mr-2 h-5 w-5" /> NOVO PALETE
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Adicionar Palete</DialogTitle>
            </DialogHeader>
            <StockForm form={form} onSubmit={onSubmit} isPending={createMutation.isPending} submitLabel="SALVAR NO ESTOQUE" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Expiry alert banner */}
      {expiringCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-300 rounded-xl px-4 py-3 mb-4 text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm font-semibold">
            {expiringCount} palete{expiringCount > 1 ? "s" : ""} com validade próxima ou vencida.
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Editar Palete</DialogTitle>
          </DialogHeader>
          <StockForm form={form} onSubmit={onSubmit} isPending={updateMutation.isPending} submitLabel="ATUALIZAR" />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Remover Palete?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 font-bold">CANCELAR</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 font-bold">
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "REMOVER"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search + Filter row */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar produto, palete ou câmara..."
            className="pl-12 h-12 text-base rounded-xl shadow-sm border-2 focus-visible:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter dropdown button */}
        {uniqueLocations.length > 1 && (
          <div className="relative" ref={filterRef}>
            <Button
              variant="outline"
              className={`h-12 px-4 border-2 font-bold gap-2 shrink-0 ${hasActiveFilters ? "border-primary text-primary bg-primary/5" : ""}`}
              onClick={() => setFilterOpen(o => !o)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filtrar</span>
              {hasActiveFilters && (
                <span className="bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-black">
                  {selectedLocations.size}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </Button>

            {/* Dropdown panel */}
            {filterOpen && (
              <div className="absolute right-0 top-14 z-30 bg-white dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-700 rounded-2xl shadow-xl w-72 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> Câmaras Frias
                  </p>
                  <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                        <X className="h-3 w-3" /> Limpar
                      </button>
                    )}
                    <button onClick={() => setFilterOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {uniqueLocations.map((loc) => {
                    const checked = selectedLocations.has(loc);
                    const count = (items ?? []).filter(i => i.location === loc).length;
                    return (
                      <label key={loc} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                        checked ? "bg-primary/10 text-primary" : "hover:bg-gray-50 dark:hover:bg-zinc-800"
                      }`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleLocation(loc)}
                          className="h-4 w-4 accent-primary shrink-0"
                        />
                        <span className="flex-1 text-sm font-semibold truncate">{loc}</span>
                        <span className="text-xs font-bold bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 rounded-full px-2 py-0.5 shrink-0">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <Button
                  className="w-full h-10 font-bold mt-3"
                  onClick={() => setFilterOpen(false)}
                >
                  Aplicar ({filteredItems.length} resultado{filteredItems.length !== 1 ? "s" : ""})
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-3">
          {Array.from(selectedLocations).map(loc => (
            <span key={loc} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/30">
              {loc}
              <button onClick={() => toggleLocation(loc)} className="ml-1 hover:text-primary/60">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Scroll buttons */}
      {filteredItems.length > 5 && (
        <div className="flex gap-2 mb-4 justify-end">
          <Button variant="outline" size="sm" onClick={scrollToTop} className="gap-1 text-xs font-bold">
            <ChevronsUp className="h-4 w-4" /> Início
          </Button>
          <Button variant="outline" size="sm" onClick={scrollToBottom} className="gap-1 text-xs font-bold">
            <ChevronsDown className="h-4 w-4" /> Fim
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {filteredItems.map((item) => {
            const expiryStatus = getExpiryStatus(item.expiryDate);
            const borderColor =
              expiryStatus === "expired" ? "border-red-400 hover:border-red-500" :
              expiryStatus === "soon" ? "border-amber-400 hover:border-amber-500" :
              "border-gray-100 hover:border-primary/50";
            return (
              <Card key={item.id} className={`overflow-hidden border-2 transition-colors shadow-sm ${borderColor}`}>
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Location column */}
                    <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex flex-col justify-center items-center md:w-52 shrink-0 border-b md:border-b-0 md:border-r-2 border-dashed gap-1">
                      <MapPin className="h-6 w-6 text-primary" />
                      <Badge variant="outline" className="text-xs px-2 py-0.5 font-bold bg-white dark:bg-gray-900 border-2 text-center whitespace-normal break-words max-w-full">
                        {item.location}
                      </Badge>
                      {item.palletNumber && (
                        <span className="text-xs font-bold text-gray-500 flex items-center gap-1 mt-0.5">
                          <Hash className="h-3 w-3" /> Palete {item.palletNumber}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="px-4 py-3 flex-1 flex flex-col justify-center gap-1">
                      <h3 className="text-base font-bold flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400 shrink-0" />
                        {item.productName}
                      </h3>
                      {item.expiryDate && (
                        <p className={`text-sm font-semibold flex items-center gap-1 ${
                          expiryStatus === "expired" ? "text-red-600" :
                          expiryStatus === "soon" ? "text-amber-600" :
                          "text-green-600"
                        }`}>
                          {expiryStatus === "expired"
                            ? <AlertTriangle className="h-3.5 w-3.5" />
                            : <Calendar className="h-3.5 w-3.5" />}
                          {expiryStatus === "expired" ? "VENCIDO: " : "Validade: "}
                          {item.expiryDate}
                        </p>
                      )}
                      {item.description && (
                        <p className="text-sm text-gray-500 flex items-start gap-1">
                          <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="px-3 py-3 bg-gray-50 dark:bg-gray-900/50 flex flex-row md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 shrink-0">
                      <Button variant="secondary" size="sm" className="h-9 font-bold" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4 md:mr-1" />
                        <span className="hidden md:inline">EDITAR</span>
                      </Button>
                      <Button variant="destructive" size="sm" className="h-9 font-bold" onClick={() => setDeletingId(item.id)}>
                        <Trash2 className="h-4 w-4 md:mr-1" />
                        <span className="hidden md:inline">EXCLUIR</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/30 rounded-xl border-2 border-dashed">
          <Package className="h-14 w-14 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-500">Nenhum palete encontrado</h3>
          <p className="text-gray-400 mt-1">Tente outro termo ou adicione um novo palete.</p>
        </div>
      )}
    </Layout>
  );
}
