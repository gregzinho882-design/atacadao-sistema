import React from "react";
import { Link, useLocation } from "wouter";
import { Package, Hash, LogOut, LayoutDashboard, Menu, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLogout, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useGetMe();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/login");
      },
    });
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-6 w-6" /> },
    { href: "/estoque", label: "Estoque", icon: <Package className="h-6 w-6" /> },
    { href: "/codigos", label: "Códigos", icon: <Hash className="h-6 w-6" /> },
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-primary text-primary-foreground">
      <div className="p-6 border-b border-primary-foreground/20 flex flex-col items-center gap-2">
        <img src="/logo-atacadao.png" alt="Atacadão" className="h-12 object-contain brightness-0 invert" />
        <p className="text-primary-foreground/80 text-sm font-medium tracking-widest">Sistema de Armazém</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={`flex items-center gap-4 px-4 py-4 rounded-md transition-colors cursor-pointer text-lg font-medium
              ${location === item.href ? "bg-white text-primary shadow-sm" : "hover:bg-primary-foreground/10"}`}>
              {item.icon}
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
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
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 shadow-xl z-10">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:pl-72 w-full max-w-full">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between p-4 bg-primary text-primary-foreground shadow-md">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
                  <Menu className="h-8 w-8" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 border-r-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <img src="/logo-atacadao.png" alt="Atacadão" className="h-8 object-contain brightness-0 invert" />
          </div>
          <div className="h-8 w-8 rounded-full bg-white text-primary flex items-center justify-center font-bold">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
