import React from "react";
import { Link, useLocation } from "wouter";
import { Package, Hash, LogOut, LayoutDashboard, Loader2, WifiOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogout, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useOffline } from "@/hooks/use-offline";

interface FabAction {
  label: string;
  onClick: () => void;
}

interface LayoutProps {
  children: React.ReactNode;
  fab?: FabAction;
}

export function Layout({ children, fab }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useGetMe();
  const isOffline = useOffline();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/login");
      },
    });
  };

  const navItems = [
    { href: "/dashboard", label: "Início", icon: LayoutDashboard },
    { href: "/estoque", label: "Estoque", icon: Package },
    { href: "/codigos", label: "Códigos", icon: Hash },
  ];

  React.useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const DesktopSidebar = () => (
    <div className="flex flex-col h-full bg-primary text-primary-foreground">
      <div className="p-6 border-b border-primary-foreground/20 flex flex-col items-center gap-2">
        <img src="/logo-atacadao.png" alt="Atacadão" className="h-12 object-contain" />
        <p className="text-primary-foreground/80 text-sm font-medium tracking-widest">Sistema dos Frios</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-4 px-4 py-4 rounded-md transition-colors cursor-pointer text-lg font-medium
                ${location === item.href ? "bg-white text-primary shadow-sm" : "hover:bg-primary-foreground/10"}`}>
                <Icon className="h-6 w-6" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-primary-foreground/20">
        <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-md bg-primary-foreground/10">
          <div className="h-10 w-10 rounded-full bg-white text-primary flex items-center justify-center font-bold text-lg">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-semibold truncate">{user?.username}</p>
            <p className="text-xs text-primary-foreground/70">Operador</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground hover:text-primary py-6 text-lg"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 shadow-xl z-10">
        <DesktopSidebar />
      </aside>

      {/* ── Mobile Top Header ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground shadow-md">
        <img src="/logo-atacadao.png" alt="Atacadão" className="h-8 object-contain" />
        <div className="flex items-center gap-2">
          {isOffline && <WifiOff className="h-4 w-4 text-white/70" />}
          <span className="text-sm font-semibold text-primary-foreground/90">{user?.username}</span>
          <div className="h-8 w-8 rounded-full bg-white text-primary flex items-center justify-center font-bold text-sm">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* ── Offline Banner ── */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 md:left-72">
          <div className="bg-amber-500 text-white text-center text-sm font-bold py-2 px-4 flex items-center justify-center gap-2 shadow-md">
            <WifiOff className="h-4 w-4 shrink-0" />
            Sem conexão — mostrando dados salvos
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col md:pl-72 w-full max-w-full">
        <main className={`flex-1 pb-24 px-4 md:pb-0 md:p-8 overflow-x-hidden ${isOffline ? "pt-24 md:pt-10" : "pt-16 md:pt-0"}`}>
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile FAB ── */}
      {fab && (
        <button
          onClick={fab.onClick}
          className="md:hidden fixed bottom-20 right-4 z-30 flex items-center gap-2 bg-primary text-white font-black text-sm px-5 h-14 rounded-full shadow-lg shadow-primary/40 active:scale-95 transition-transform"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <Plus className="h-5 w-5 shrink-0" strokeWidth={3} />
          {fab.label}
        </button>
      )}

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-700 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <div className={`flex flex-col items-center justify-center h-full gap-0.5 transition-colors
                  ${isActive ? "text-primary" : "text-gray-400 dark:text-zinc-500"}`}>
                  <div className={`p-1 rounded-xl transition-all ${isActive ? "bg-primary/10" : ""}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-[10px] font-semibold tracking-wide ${isActive ? "text-primary" : ""}`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}

          {/* Sair */}
          <button
            onClick={handleLogout}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-400 dark:text-zinc-500 transition-colors active:text-red-500"
          >
            <div className="p-1 rounded-xl">
              <LogOut className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-semibold tracking-wide">Sair</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
