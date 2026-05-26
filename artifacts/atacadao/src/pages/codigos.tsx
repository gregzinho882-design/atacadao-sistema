import React, { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListProductCodes,
  useCreateProductCode,
  useUpdateProductCode,
  useDeleteProductCode,
  getListProductCodesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Trash2, Edit, MapPin, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const codeSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  productName: z.string().min(1, "Nome do produto é obrigatório"),
  location: z.string().optional(),
});

type CodeFormValues = z.infer<typeof codeSchema>;

function CodeForm({
  form,
  onSubmit,
  isPending,
  submitLabel,
}: {
  form: ReturnType<typeof useForm<CodeFormValues>>;
  onSubmit: (data: CodeFormValues) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <FormField control={form.control} name="code" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-bold uppercase text-gray-600">Código</FormLabel>
            <FormControl>
              <Input
                placeholder="Ex: 1042"
                inputMode="numeric"
                className="h-12 text-xl font-black font-mono tracking-widest"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="productName" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-bold uppercase text-gray-600">Produto</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Alcatra Bovina KG" className="h-12 text-base" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="location" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-bold uppercase text-gray-600">Localização (Opcional)</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Câmara Fria Carnes - Seção B" className="h-12 text-base" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full h-12 text-base font-bold" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : submitLabel}
        </Button>
      </form>
    </Form>
  );
}

export default function Codigos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: codes, isLoading } = useListProductCodes();
  const createMutation = useCreateProductCode();
  const updateMutation = useUpdateProductCode();
  const deleteMutation = useDeleteProductCode();

  const form = useForm<CodeFormValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "", productName: "", location: "" },
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: getListProductCodesQueryKey() });
  };

  const onSubmit = (data: CodeFormValues) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data }, {
        onSuccess: () => { invalidateQueries(); setEditingItem(null); toast({ title: "Código atualizado" }); }
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => { invalidateQueries(); setIsAddOpen(false); form.reset(); toast({ title: "Código adicionado" }); }
      });
    }
  };

  const handleEdit = (item: any) => {
    form.reset({ code: item.code, productName: item.productName, location: item.location ?? "" });
    setEditingItem(item);
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteMutation.mutate({ id: deletingId }, {
        onSuccess: () => { invalidateQueries(); setDeletingId(null); toast({ title: "Código removido" }); }
      });
    }
  };

  const filteredCodes = codes?.filter(c =>
    c.code.includes(searchTerm) ||
    c.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.location ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Códigos de Balança</h1>
          <p className="text-gray-500 font-medium mt-1">
            {codes ? `${codes.length} código${codes.length !== 1 ? "s" : ""} cadastrado${codes.length !== 1 ? "s" : ""}` : "Consulte os códigos para pesagem"}
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) form.reset(); setIsAddOpen(open); }}>
          <DialogTrigger asChild>
            <Button className="h-12 px-5 text-base font-bold shadow-md w-full md:w-auto">
              <Plus className="mr-2 h-5 w-5" /> NOVO CÓDIGO
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Adicionar Código</DialogTitle>
            </DialogHeader>
            <CodeForm form={form} onSubmit={onSubmit} isPending={createMutation.isPending} submitLabel="SALVAR" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Editar Código</DialogTitle>
          </DialogHeader>
          <CodeForm form={form} onSubmit={onSubmit} isPending={updateMutation.isPending} submitLabel="ATUALIZAR" />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Código?</AlertDialogTitle>
            <AlertDialogDescription>O código será removido do sistema.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 font-bold">CANCELAR</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 font-bold"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "REMOVER"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Buscar por código, produto ou localização..."
          className="pl-12 h-12 text-base rounded-xl shadow-sm border-2 focus-visible:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          inputMode="search"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[72px] w-full rounded-2xl" />)}
        </div>
      ) : filteredCodes.length > 0 ? (
        <div className="space-y-2.5">
          {filteredCodes.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-4 bg-white dark:bg-zinc-900 border-2 border-gray-100 dark:border-zinc-800 rounded-2xl px-4 py-3 hover:border-primary/30 hover:shadow-md transition-all"
            >
              {/* Code number pill */}
              <div className="shrink-0 min-w-[64px] h-12 rounded-xl bg-primary flex items-center justify-center shadow-sm px-3">
                <span className="text-white font-black text-xl font-mono leading-none tracking-tight">
                  {item.code}
                </span>
              </div>

              {/* Product info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[15px] text-gray-900 dark:text-white leading-tight truncate">
                  {item.productName}
                </p>
                {item.location ? (
                  <p className="text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1 mt-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
                    {item.location}
                  </p>
                ) : (
                  <p className="text-xs text-gray-300 dark:text-zinc-600 mt-1">Sem localização</p>
                )}
              </div>

              {/* Actions — visible on hover (desktop) or always (mobile) */}
              <div className="flex gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-gray-500 hover:text-primary hover:bg-primary/10"
                  onClick={() => handleEdit(item)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-gray-500 hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setDeletingId(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border-2 border-dashed">
          <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Tag className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-500">Nenhum código encontrado</h3>
          <p className="text-gray-400 mt-1 text-sm">
            {searchTerm ? "Tente outro termo de busca." : "Adicione o primeiro código de balança."}
          </p>
          {!searchTerm && (
            <Button className="mt-5 font-bold" onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Código
            </Button>
          )}
        </div>
      )}
    </Layout>
  );
}
