import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  // Consultamos los logs recientes
  const { data: logs } = trpc.logs.list.useQuery(
    { limit: 20 }, 
    { refetchInterval: 10000 } // Refrescar cada 10 segundos
  );

  // Filtramos solo las alertas
  const alerts = logs?.filter(log => log.action === "ALERT_TRIGGERED") || [];
  const hasAlerts = alerts.length > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasAlerts && (
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificaciones Recientes</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {alerts.length === 0 ? (
          <div className="p-4 text-sm text-center text-muted-foreground">
            No hay alertas nuevas
          </div>
        ) : (
          alerts.slice(0, 5).map((alert) => (
            <DropdownMenuItem 
              key={alert.id} 
              className="flex flex-col items-start gap-1 p-3 cursor-pointer"
              onClick={() => setLocation("/logs")}
            >
              <div className="flex items-center gap-2 w-full">
                <Badge variant="destructive" className="h-2 w-2 rounded-full p-0" />
                <span className="font-semibold text-sm">Alerta de Seguridad</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {alert.details}
              </p>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="justify-center text-primary font-medium"
          onClick={() => setLocation("/logs")}
        >
          Ver todo el historial
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}