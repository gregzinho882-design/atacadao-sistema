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
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, MapPin, Package, Edit, Trash2, FileText,
  Loader2, Hash, Calendar, ChevronsDown, ChevronsUp, AlertTriangle, Filter
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

function parseExpiry(expiryDate: string): Date | null {
  const parts = expiryDate.split("/");
  if (parts.length !== 2) return null;
  const month = parseInt(parts[0], 10);
  const year = parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(year)) return null;
  return new Date(year, month - 1, 1);
}

function getExpiryStatus(expiryDate: string | null | undefined): "expired" | "soon" | "ok" | null {
  if (!expiryDate) return null;
  const date = parseExpiry(expiryDate);
  if (!date) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "expired";
  if (diffDays <= 30) return "soon";
  return "ok";
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
                <Input placeholder="MM/AAAA" className="h-12 text-base font-mono" maxLength={7} {...field}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "");
                    if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2, 6);
                    field.onChange(v);
                  }}
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
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

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
      const matchesLocation = !locationFilter || item.location === locationFilter;
      return matchesSearch && matchesLocation;
    });
  }, [items, searchTerm, locationFilter]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });

  return (
    <Layout>
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

      {/* Expiry alert */}
      {expiringCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-300 rounded-xl px-4 py-3 mb-4 text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm font-semibold">
            {expiringCount} palete{expiringCount > 1 ? "s" : ""} com validade próxima ou vencida. Confira abaixo.
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

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Buscar por produto, palete ou localização..."
          className="pl-12 h-13 text-base rounded-xl shadow-sm border-2 focus-visible:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Location filter chips */}
      {uniqueLocations.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <Filter className="h-4 w-4 text-gray-400 shrink-0" />
          <button
            onClick={() => setLocationFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-colors ${
              locationFilter === null
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-600 border-gray-200 hover:border-primary/50"
            }`}
          >
            Todas
          </button>
          {uniqueLocations.map((loc) => (
            <button
              key={loc}
              onClick={() => setLocationFilter(locationFilter === loc ? null : loc)}
              className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-colors ${
                locationFilter === loc
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-200 hover:border-primary/50"
              }`}
            >
              {loc}
            </button>
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
        <div className="grid grid-cols-1 gap-3" ref={listRef}>
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
                      <Badge variant="outline" className="text-sm px-2 py-0.5 font-mono font-bold bg-white dark:bg-gray-900 border-2 text-center whitespace-normal break-words max-w-full">
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
                          {expiryStatus === "expired" && <AlertTriangle className="h-3.5 w-3.5" />}
                          {expiryStatus !== "expired" && <Calendar className="h-3.5 w-3.5" />}
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
