import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { AlertCircle, FileText, RefreshCw } from "lucide-react";
import { Link } from "wouter";

export default function Logs() {
  const { isAuthenticated, loading } = useAuth();
  const { data: logs, isLoading, refetch } = trpc.logs.list.useQuery({ limit: 100 });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold">Acceso Restringido</h1>
          <p className="text-muted-foreground">Debes iniciar sesión para acceder a esta página</p>
          <Button asChild>
            <a href={getLoginUrl()}>Iniciar Sesión</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs de Actividad</h1>
          <p className="text-muted-foreground">Registro de eventos y acciones del sistema</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Historial de Actividad</CardTitle>
            <CardDescription>
              Últimos {logs?.length || 0} eventos registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!logs || logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay logs registrados</h3>
                <p className="text-sm text-muted-foreground">
                  Los eventos del sistema aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Entidad</TableHead>
                      <TableHead>ID Entidad</TableHead>
                      <TableHead>Detalles</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('es-ES')}
                        </TableCell>
                        <TableCell>{log.userId || '-'}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell>{log.entity || '-'}</TableCell>
                        <TableCell>{log.entityId || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.details || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {log.ipAddress || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
