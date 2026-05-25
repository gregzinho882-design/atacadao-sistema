import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { 
  useListProductCodes, 
  useCreateProductCode, 
  useDeleteProductCode,
  getListProductCodesQueryKey,
  getGetStockSummaryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Plus, 
  Search, 
  Hash, 
  Trash2, 
  Loader2,
  Scale
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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

const productCodeSchema = z.object({
  code: z.string().min(1, "Código é obrigatório").regex(/^\d+$/, "Apenas números"),
  productName: z.string().min(1, "Nome do produto é obrigatório"),
});

type ProductCodeFormValues = z.infer<typeof productCodeSchema>;

export default function Codigos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: codes, isLoading } = useListProductCodes();
  const createMutation = useCreateProductCode();
  const deleteMutation = useDeleteProductCode();

  const form = useForm<ProductCodeFormValues>({
    resolver: zodResolver(productCodeSchema),
    defaultValues: {
      code: "",
      productName: "",
    },
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: getListProductCodesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStockSummaryQueryKey() });
  };

  const onSubmit = (data: ProductCodeFormValues) => {
    createMutation.mutate({ data }, {
      onSuccess: () => {
        invalidateQueries();
        setIsAddOpen(false);
        form.reset();
        toast({ title: "Código adicionado com sucesso" });
      }
    });
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteMutation.mutate({ id: deletingId }, {
        onSuccess: () => {
          invalidateQueries();
          setDeletingId(null);
          toast({ title: "Código removido com sucesso" });
        }
      });
    }
  };

  const filteredCodes = codes?.filter(c => 
    c.code.includes(searchTerm) ||
    c.productName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Códigos de Balança</h1>
          <p className="text-gray-500 font-medium mt-1">Consulte os códigos para pesagem</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={(open) => {
          if (!open) form.reset();
          setIsAddOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button className="h-14 px-6 text-lg font-bold shadow-md w-full md:w-auto">
              <Plus className="mr-2 h-6 w-6" />
              NOVO CÓDIGO
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Adicionar Código</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-bold uppercase text-gray-600">Código Numérico</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 4501" className="h-16 text-2xl font-mono text-center font-bold" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-bold uppercase text-gray-600">Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Queijo Mussarela Peça" className="h-14 text-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "SALVAR CÓDIGO"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Remover Código?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              O código PLU será removido do sistema. Confirma?
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
          placeholder="Buscar por nome ou número..." 
          className="pl-12 h-16 text-xl rounded-xl shadow-sm border-2 focus-visible:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredCodes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCodes.map((item) => (
            <Card key={item.id} className="overflow-hidden border-2 shadow-sm group">
              <CardContent className="p-0 flex h-full">
                <div className="bg-gray-900 text-white w-28 flex flex-col items-center justify-center p-4">
                  <Hash className="h-6 w-6 text-gray-400 mb-1" />
                  <span className="text-2xl font-black font-mono tracking-tighter">{item.code}</span>
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between bg-white dark:bg-zinc-900">
                  <div className="font-bold text-lg leading-tight line-clamp-2">
                    {item.productName}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-400 hover:text-destructive hover:bg-destructive/10 h-10 w-10 rounded-full"
                      onClick={() => setDeletingId(item.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/30 rounded-xl border-2 border-dashed">
          <Scale className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-500">Nenhum código encontrado</h3>
        </div>
      )}
    </Layout>
  );
}
