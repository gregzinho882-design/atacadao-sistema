import React, { useState, useRef } from "react";
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
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, MapPin, Package, Edit, Trash2, FileText,
  Loader2, Hash, Calendar, ChevronsDown, ChevronsUp
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
            <FormLabel className="text-sm font-bold uppercase text-gray-600">Localização</FormLabel>
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

  const filteredItems = items?.filter(item =>
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.palletNumber ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const scrollTop = () => listRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollBottom = () => {
    const el = listRef.current;
    if (el) el.lastElementChild?.scrollIntoView({ behavior: "smooth" });
  };

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

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Buscar por produto, palete ou localização..."
          className="pl-12 h-13 text-base rounded-xl shadow-sm border-2 focus-visible:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Scroll buttons */}
      {filteredItems.length > 3 && (
        <div className="flex gap-2 mb-4 justify-end">
          <Button variant="outline" size="sm" onClick={scrollTop} className="gap-1 text-xs font-bold">
            <ChevronsUp className="h-4 w-4" /> Início
          </Button>
          <Button variant="outline" size="sm" onClick={scrollBottom} className="gap-1 text-xs font-bold">
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
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden border-2 hover:border-primary/50 transition-colors shadow-sm">
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
                      <p className="text-sm text-amber-600 font-semibold flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Validade: {item.expiryDate}
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
          ))}
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
