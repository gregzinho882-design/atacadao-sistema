import React, { useState } from "react";
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
  Plus, 
  Search, 
  MapPin, 
  Package, 
  Edit, 
  Trash2, 
  FileText,
  Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const stockItemSchema = z.object({
  productName: z.string().min(1, "Nome do produto é obrigatório"),
  location: z.string().min(1, "Localização é obrigatória"),
  description: z.string().optional(),
});

type StockItemFormValues = z.infer<typeof stockItemSchema>;

export default function Estoque() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: items, isLoading } = useListStockItems();
  const createMutation = useCreateStockItem();
  const updateMutation = useUpdateStockItem();
  const deleteMutation = useDeleteStockItem();

  const form = useForm<StockItemFormValues>({
    resolver: zodResolver(stockItemSchema),
    defaultValues: {
      productName: "",
      location: "",
      description: "",
    },
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: getListStockItemsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStockSummaryQueryKey() });
  };

  const onSubmit = (data: StockItemFormValues) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data }, {
        onSuccess: () => {
          invalidateQueries();
          setEditingItem(null);
          toast({ title: "Item atualizado com sucesso" });
        }
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          invalidateQueries();
          setIsAddOpen(false);
          form.reset();
          toast({ title: "Item adicionado com sucesso" });
        }
      });
    }
  };

  const handleEdit = (item: any) => {
    form.reset({
      productName: item.productName,
      location: item.location,
      description: item.description || "",
    });
    setEditingItem(item);
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteMutation.mutate({ id: deletingId }, {
        onSuccess: () => {
          invalidateQueries();
          setDeletingId(null);
          toast({ title: "Item removido com sucesso" });
        }
      });
    }
  };

  const filteredItems = items?.filter(item => 
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Estoque</h1>
          <p className="text-gray-500 font-medium mt-1">Gerencie a localização dos paletes na câmara fria</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={(open) => {
          if (!open) form.reset();
          setIsAddOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button className="h-14 px-6 text-lg font-bold shadow-md w-full md:w-auto">
              <Plus className="mr-2 h-6 w-6" />
              NOVO PALETE
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Adicionar Palete</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                <FormField
                  control={form.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-bold uppercase text-gray-600">Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Frango Congelado CX 15KG" className="h-14 text-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-bold uppercase text-gray-600">Localização</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: CF-01 C-A P-03" className="h-14 text-lg uppercase font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-bold uppercase text-gray-600">Observações (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Lote com vencimento próximo" className="h-14 text-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "SALVAR NO ESTOQUE"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Editar Palete</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-bold uppercase text-gray-600">Produto</FormLabel>
                    <FormControl>
                      <Input className="h-14 text-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-bold uppercase text-gray-600">Localização</FormLabel>
                    <FormControl>
                      <Input className="h-14 text-lg uppercase font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-bold uppercase text-gray-600">Observações (Opcional)</FormLabel>
                    <FormControl>
                      <Input className="h-14 text-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "ATUALIZAR"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Remover Palete?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Esta ação não pode ser desfeita. O palete será removido do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12 font-bold">CANCELAR</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-12 font-bold">
              {deleteMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "REMOVER"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
        <Input 
          placeholder="Buscar por produto ou localização..." 
          className="pl-12 h-16 text-lg rounded-xl shadow-sm border-2 focus-visible:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden border-2 hover:border-primary/50 transition-colors shadow-sm">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="bg-gray-100 dark:bg-gray-800 p-6 flex flex-col justify-center items-center md:w-56 shrink-0 border-b md:border-b-0 md:border-r-2 border-dashed">
                    <MapPin className="h-8 w-8 text-primary mb-2" />
                    <Badge variant="outline" className="text-base px-3 py-1 font-mono font-bold bg-white dark:bg-gray-900 border-2 text-center whitespace-normal break-words max-w-full">
                      {item.location}
                    </Badge>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Package className="h-5 w-5 text-gray-400" />
                      {item.productName}
                    </h3>
                    {item.description && (
                      <p className="text-gray-500 mt-2 flex items-start gap-2">
                        <FileText className="h-5 w-5 mt-0.5 shrink-0" />
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900/50 flex flex-row md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800">
                    <Button 
                      variant="secondary" 
                      className="flex-1 md:flex-none h-12 font-bold"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-5 w-5 md:mr-2" />
                      <span className="hidden md:inline">EDITAR</span>
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1 md:flex-none h-12 font-bold"
                      onClick={() => setDeletingId(item.id)}
                    >
                      <Trash2 className="h-5 w-5 md:mr-2" />
                      <span className="hidden md:inline">EXCLUIR</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/30 rounded-xl border-2 border-dashed">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-500">Nenhum palete encontrado</h3>
          <p className="text-gray-400 mt-2">Tente buscar por outro termo ou adicione um novo palete.</p>
        </div>
      )}
    </Layout>
  );
}
