import React from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Lock, User } from "lucide-react";
import { requestNotificationPermission } from "@/hooks/use-expiry-notifications";

const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const loginMutation = useLogin();
  const { data: user, isLoading: isUserLoading } = useGetMe();

  React.useEffect(() => {
    if (user && !isUserLoading) setLocation("/dashboard");
  }, [user, isUserLoading, setLocation]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries();
        requestNotificationPermission();
        setLocation("/dashboard");
      },
    });
  };

  if (isUserLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel — branding */}
      <div className="md:flex-1 bg-primary flex flex-col items-center justify-center p-8 md:p-16 gap-6">
        <img src="/logo-atacadao.png" alt="Atacadão" className="h-24 md:h-32 object-contain drop-shadow-xl" />
        <div className="text-center">
          <h1 className="text-white font-black text-3xl md:text-4xl tracking-tight leading-tight">
            Sistema dos Frios
          </h1>
          <p className="text-white/70 mt-2 text-base md:text-lg font-medium">
            Gestão de Câmara Fria e Balança
          </p>
        </div>

      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-zinc-950">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Acesso Operador</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Entre com suas credenciais para continuar</p>
          </div>

          {loginMutation.isError && (
            <Alert variant="destructive" className="mb-6 bg-destructive/10 text-destructive border-destructive/20">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="ml-2 font-medium">
                Usuário ou senha incorretos
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold uppercase text-gray-500 tracking-wider">Usuário</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                      <Input
                        placeholder="Ex: Admin"
                        {...field}
                        className="h-14 pl-12 text-base bg-white dark:bg-zinc-900 border-2 focus-visible:ring-primary"
                        autoComplete="username"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold uppercase text-gray-500 tracking-wider">Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        className="h-14 pl-12 text-base bg-white dark:bg-zinc-900 border-2 focus-visible:ring-primary"
                        autoComplete="current-password"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button
                type="submit"
                className="w-full h-14 text-base font-black uppercase tracking-widest shadow-lg mt-2"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending
                  ? <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  : null}
                ENTRAR
              </Button>
            </form>
          </Form>

          <p className="text-center text-xs text-gray-400 mt-8">
            Atacadão Frios — Sistema de Câmara Fria
          </p>
        </div>
      </div>
    </div>
  );
}
